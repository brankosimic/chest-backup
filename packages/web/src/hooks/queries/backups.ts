import { useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { RunStatus, RunTrigger } from "@chest-backup/shared"
import type { BackupRunProgress } from "@/types/backup"
import { RunPhase } from "@/types/backup"
import { isActiveRunPhase, isTerminalRunPhase } from "@/lib/run-phase"
import { invalidateRunQueries } from "@/lib/query-keys"
import {
  fetchBackups,
  fetchBackupStats,
  fetchBackupProgress,
  triggerBackup,
  fetchLogs,
  fetchLogStats,
  clearStoredLogs,
} from "@/lib/api-client"
import type { RunQuery, LogQuery } from "@/types/api"

const IDLE_REFETCH_MS = 10_000

const useBackups = (query: RunQuery = {}) => useQuery({ queryKey: ["backups", query], queryFn: () => fetchBackups(query) })

const useBackupStats = (query: RunQuery = {}) =>
  useQuery({ queryKey: ["backup-stats", query], queryFn: () => fetchBackupStats(query), refetchInterval: 15_000 })

const useBackupProgress = () => {
  const qc = useQueryClient()
  const settledRunId = useRef<string | null>(null)
  const lastSeen = useRef<BackupRunProgress | null>(null)

  const query = useQuery({
    queryKey: ["backup-progress"],
    queryFn: async () => {
      const data = await fetchBackupProgress()
      if (data) lastSeen.current = data
      return data ?? lastSeen.current
    },
    refetchInterval: (current) => {
      const data = current.state.data
      if (!data) return IDLE_REFETCH_MS
      return isActiveRunPhase(data.phase) ? 1_000 : false
    },
  })

  const phase = query.data?.phase
  const runId = query.data?.runId

  useEffect(() => {
    if (!runId || !phase || !isTerminalRunPhase(phase)) return
    if (settledRunId.current === runId) return

    settledRunId.current = runId
    invalidateRunQueries(qc)
  }, [phase, runId, qc])

  return query
}

const useTriggerBackup = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: triggerBackup,
    onMutate: () => {
      const progress: BackupRunProgress = {
        runId: "pending",
        status: RunStatus.Running,
        phase: RunPhase.Queued,
        trigger: RunTrigger.Manual,
        startedAt: new Date().toISOString(),
        finishedAt: "",
        timestamp: "",
        destinations: [],
        errors: [],
      }
      qc.setQueryData<BackupRunProgress>(["backup-progress"], progress)
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
