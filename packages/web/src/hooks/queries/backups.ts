import { useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Destination } from "@chest-backup/shared"
import { RunPhase } from "@/types/backup"
import {
  fetchBackups,
  fetchBackupStats,
  fetchBackupProgress,
  triggerBackup,
  fetchLogs,
  fetchLogStats,
  clearStoredLogs,
  type RunQuery,
  type LogQuery,
} from "@/lib/api-client"

const ACTIVE_PHASES: RunPhase[] = [RunPhase.Queued, RunPhase.Resolving, RunPhase.Archiving, RunPhase.Uploading]
const TERMINAL_PHASES: RunPhase[] = [RunPhase.Completed, RunPhase.Failed]
/** Fallback polling while no run has been recorded yet (e.g. waiting for the schedule). */
const IDLE_REFETCH_MS = 10_000

const useBackups = (query: RunQuery = {}) => useQuery({ queryKey: ["backups", query], queryFn: () => fetchBackups(query) })

const useBackupStats = (query: RunQuery = {}) =>
  useQuery({ queryKey: ["backup-stats", query], queryFn: () => fetchBackupStats(query), refetchInterval: 15_000 })

const useBackupProgress = () => {
  const qc = useQueryClient()
  const settledRunId = useRef<string | null>(null)
  const query = useQuery({
    queryKey: ["backup-progress"],
    queryFn: fetchBackupProgress,
    refetchInterval: (current) => {
      const data = current.state.data
      if (!data) return IDLE_REFETCH_MS
      return ACTIVE_PHASES.includes(data.phase) ? 1_000 : false
    },
  })

  const phase = query.data?.phase
  const runId = query.data?.runId

  useEffect(() => {
    if (!runId || !phase || !TERMINAL_PHASES.includes(phase)) return
    if (settledRunId.current === runId) return

    settledRunId.current = runId
    void qc.invalidateQueries({ queryKey: ["backups"] })
    void qc.invalidateQueries({ queryKey: ["backup-stats"] })
    void qc.invalidateQueries({ queryKey: ["logs"] })
    void qc.invalidateQueries({ queryKey: ["schedule"] })
  }, [phase, runId, qc])

  return query
}

const useTriggerBackup = (destinations: Destination[]) => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: triggerBackup,
    onMutate: () => {
      qc.setQueryData(["backup-progress"], {
        runId: "pending",
        status: "running" as const,
        phase: "queued" as const,
        trigger: "manual" as const,
        startedAt: new Date().toISOString(),
        finishedAt: "",
        timestamp: "",
        destinations: destinations.map((d) => ({
          id: d.id,
          name: d.name ?? d.path,
          path: d.path,
          type: d.type,
          status: "pending" as const,
        })),
        errors: [],
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["backup-progress"] })
      void qc.invalidateQueries({ queryKey: ["backups"] })
      void qc.invalidateQueries({ queryKey: ["backup-stats"] })
    },
  })
}

const useLogs = (query: LogQuery = {}) => useQuery({ queryKey: ["logs", query], queryFn: () => fetchLogs(query) })

const useLogStats = () => useQuery({ queryKey: ["log-stats"], queryFn: fetchLogStats })

const useClearLogs = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: clearStoredLogs,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["logs"] })
      void qc.invalidateQueries({ queryKey: ["log-stats"] })
    },
  })
}

export {
  useBackups,
  useBackupStats,
  useBackupProgress,
  useTriggerBackup,
  useLogs,
  useLogStats,
  useClearLogs,
}
