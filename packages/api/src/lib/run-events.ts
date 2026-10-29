import type { BackupResult, BackupProgressEvent } from "@core/types/index"
import { RunStatus, deriveRunStatus } from "@chest-backup/shared"
import type { DestRunProgress, RunPhase, RunSnapshot } from "../types/run"
import { publish } from "./event-bus"

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

const applyResultToDestination = (dest: DestRunProgress, result: BackupResult["destinationResults"][number]): void => {
  dest.status = result.skipped ? "skipped" : result.success ? "done" : "error"
  dest.message = result.error ?? dest.message
  if (result.durationMs) dest.durationMs = result.durationMs
}

const settleDestinations = (run: RunSnapshot, result: BackupResult): void => {
  run.destinations.forEach((dest) => {
    const match = result.destinationResults.find(
      (item) => item.destId === dest.id || item.destName === dest.name || item.destLabel === dest.path,
    )
    if (match) applyResultToDestination(dest, match)
  })
}

const completeRun = (runs: Map<string, RunSnapshot>, result: BackupResult): void => {
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

const failRun = (runs: Map<string, RunSnapshot>, runId: string, error: string): void => {
  const run = runs.get(runId)
  if (!run) return

  run.phase = "failed"
  run.status = RunStatus.Failed
  run.finishedAt = new Date().toISOString()
  run.errors = [error]
  emit(run)
}

const isActivePhase = (phase: RunPhase): boolean =>
  phase === "queued" || phase === "resolving" || phase === "archiving" || phase === "uploading"

export { cloneRun, findDestination, applyRunStart, applyArchiving, applyDestinationEvent, completeRun, failRun, isActivePhase }
