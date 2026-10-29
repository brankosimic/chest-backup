import type { BackupResult, BackupProgressEvent } from "@core/types/index"
import { RunStatus, RunTrigger } from "@chest-backup/shared"
import type { DestRunProgress, RunSnapshot } from "../types/run"
import { invalidateBackupCache as invalidateStoredBackupCache } from "./store/backups"
import { persistBackupResult as storePersistBackupResult } from "./store/backup-result"
import { cloneRun, findDestination, applyRunStart, applyArchiving, applyDestinationEvent, completeRun as completeRunInternal, failRun as failRunInternal, isActivePhase } from "./run-events"

const invalidateBackupCache = (): void => {
  invalidateStoredBackupCache()
}

const persistBackupResult = (result: BackupResult): void => {
  storePersistBackupResult(result)
}

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

  return run
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

const completeRun = (result: BackupResult): void => {
  completeRunInternal(runs, result)
}

const failRun = (runId: string, error: string): void => {
  failRunInternal(runs, runId, error)
}

const getRun = (runId: string): RunSnapshot | undefined => {
  const run = runs.get(runId)
  return run ? cloneRun(run) : undefined
}

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

const getProgress = (): RunSnapshot | null => getActiveRun() ?? null

const getLastFinishedRun = (): RunSnapshot | null => {
  const last = getRecentRuns(1).at(0)
  return last && !isActivePhase(last.phase) ? last : null
}

export {
  startRun,
  applyProgressEvent,
  completeRun,
  failRun,
  getRun,
  getActiveRun,
  getRecentRuns,
  getProgress,
  getLastFinishedRun,
  invalidateBackupCache,
  persistBackupResult,
}
