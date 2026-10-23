import type { BackupResult, BackupProgressEvent } from "@core/types/index"
import { RunStatus, RunTrigger, deriveRunStatus } from "@chest-backup/shared"
import type { DestRunProgress, RunPhase, RunSnapshot } from "../types/run"
import { publish } from "./event-bus"

/** How many finished runs stay in memory for instant access. */
const MAX_RECENT_RUNS = 50

const runs = new Map<string, RunSnapshot>()
const recentOrder: string[] = []

const emptyRun = (): RunSnapshot => ({
  runId: "",
  status: RunStatus.Running,
  phase: "queued",
  trigger: RunTrigger.Manual,
  startedAt: "",
  finishedAt: "",
  timestamp: "",
  destinations: [],
  errors: [],
})

const cloneRun = (run: RunSnapshot): RunSnapshot => ({
  ...run,
  destinations: run.destinations.map((dest) => ({ ...dest })),
  errors: [...run.errors],
})

const emit = (run: RunSnapshot): void => {
  publish({ type: "run", run: cloneRun(run) })
}

const findDestination = (run: RunSnapshot, event: BackupProgressEvent): DestRunProgress | undefined => {
  if (event.destId) {
    const byId = run.destinations.find((dest) => dest.id === event.destId)
    if (byId) return byId
  }
  if (event.destName) {
    const byName = run.destinations.find((dest) => dest.name === event.destName)
    if (byName) return byName
  }
  if (!event.destPath) return undefined
  return run.destinations.find((dest) => dest.path === event.destPath)
}

const toDestProgress = (dest: { id?: string; name?: string; path: string; type: string }): DestRunProgress => ({
  id: dest.id,
  name: dest.name ?? dest.path,
  path: dest.path,
  type: dest.type,
  status: "pending",
})

const startRun = (
  runId: string,
  trigger: RunTrigger,
  destinations: { id?: string; name?: string; path: string; type: string }[],
  timestamp: string,
): RunSnapshot => {
  const run: RunSnapshot = {
    ...emptyRun(),
    runId,
    trigger,
    timestamp,
    startedAt: new Date().toISOString(),
    destinations: destinations.map(toDestProgress),
  }

  runs.set(runId, run)
  recentOrder.unshift(runId)

  while (recentOrder.length > MAX_RECENT_RUNS) {
    const dropped = recentOrder.pop()
    if (dropped) runs.delete(dropped)
  }

  emit(run)
  return run
}

const markDestinationStarted = (dest: DestRunProgress): void => {
  dest.status = "uploading"
  dest.startedAt = new Date().toISOString()
}

const markDestinationDone = (dest: DestRunProgress, event: BackupProgressEvent): void => {
  dest.status = event.message === "skipped" ? "skipped" : "done"
  dest.finishedAt = new Date().toISOString()
  if (event.speed) dest.speed = event.speed
  if (dest.startedAt) dest.durationMs = Date.parse(dest.finishedAt) - Date.parse(dest.startedAt)
}

const markDestinationFailed = (dest: DestRunProgress, event: BackupProgressEvent): void => {
  dest.status = "error"
  dest.message = event.message
  dest.finishedAt = new Date().toISOString()
  if (dest.startedAt) dest.durationMs = Date.parse(dest.finishedAt) - Date.parse(dest.startedAt)
}

const applyRunStart = (run: RunSnapshot, event: BackupProgressEvent): void => {
  run.startedAt = run.startedAt || new Date().toISOString()
  if (event.timestamp) run.timestamp = event.timestamp
  run.phase = "resolving"
  emit(run)
}

const applyArchiving = (run: RunSnapshot, event: BackupProgressEvent): void => {
  run.phase = "archiving"
  if (event.archiveSize) run.archiveSize = event.archiveSize
  emit(run)
}

const applyDestinationEvent = (run: RunSnapshot, event: BackupProgressEvent, dest: DestRunProgress): void => {
  if (event.phase === "destination-start") {
    run.phase = "uploading"
    markDestinationStarted(dest)
  }
  if (event.phase === "destination-done") markDestinationDone(dest, event)
  if (event.phase === "destination-error") markDestinationFailed(dest, event)
  emit(run)
}

const applyProgressEvent = (event: BackupProgressEvent): void => {
  if (!event.runId) return

  const run = runs.get(event.runId)
  if (!run) return

  if (event.phase === "run-start") {
    applyRunStart(run, event)
    return
  }

  if (event.phase === "archiving") {
    applyArchiving(run, event)
    return
  }

  const dest = findDestination(run, event)
  if (!dest) return
  applyDestinationEvent(run, event, dest)
}

const applyResultToDestination = (dest: DestRunProgress, result: BackupResult["destinationResults"][number]): void => {
  dest.status = result.skipped ? "skipped" : result.success ? "done" : "error"
  dest.message = result.error ?? dest.message
  if (result.durationMs) dest.durationMs = result.durationMs
}

const settleDestinations = (run: RunSnapshot, result: BackupResult): void => {
  run.destinations
    .filter((dest) => dest.status !== "pending" && dest.status !== "uploading")
    .forEach((dest) => {
      const match = result.destinationResults.find(
        (item) => item.destId === dest.id || item.destName === dest.name || item.destLabel === dest.path,
      )
      if (match) applyResultToDestination(dest, match)
    })
}

const completeRun = (result: BackupResult): void => {
  const run = runs.get(result.runId)
  if (!run) return

  run.finishedAt = result.finishedAt
  run.durationMs = result.durationMs
  run.phase = result.success ? "completed" : "failed"
  run.status = deriveRunStatus({ success: result.success, results: result.destinationResults })
  run.errors = [...result.errors]
  run.filesChanged = result.filesChanged
  run.filesBackedUp = result.filesBackedUp
  run.totalUploadedBytes = result.totalUploadedBytes
  if (result.archiveSize) run.archiveSize = result.archiveSize
  settleDestinations(run, result)

  emit(run)
}

const failRun = (runId: string, error: string): void => {
  const run = runs.get(runId)
  if (!run) return

  run.phase = "failed"
  run.status = RunStatus.Failed
  run.finishedAt = new Date().toISOString()
  run.errors = [error]
  emit(run)
}

const getRun = (runId: string): RunSnapshot | undefined => {
  const run = runs.get(runId)
  return run ? cloneRun(run) : undefined
}

const isActivePhase = (phase: RunPhase): boolean =>
  phase === "queued" || phase === "resolving" || phase === "archiving" || phase === "uploading"

const getActiveRun = (): RunSnapshot | undefined => {
  const active = recentOrder
    .map((runId) => runs.get(runId))
    .find((run) => run && isActivePhase(run.phase))
  return active ? cloneRun(active) : undefined
}

const getRecentRuns = (limit = MAX_RECENT_RUNS): RunSnapshot[] =>
  recentOrder.slice(0, limit).flatMap((runId) => {
    const run = runs.get(runId)
    return run ? [cloneRun(run)] : []
  })

/**
 * Backwards-compatible view of the currently running (or last finished) run.
 * Returns null when the process has not seen a run yet.
 */
const getProgress = (): RunSnapshot | null => getActiveRun() ?? getRecentRuns(1).at(0) ?? null

export {
  startRun,
  applyProgressEvent,
  completeRun,
  failRun,
  getRun,
  getActiveRun,
  getRecentRuns,
  getProgress,
}
