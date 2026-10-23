import { useQuery, useMutation, useQueryClient, useQueryClient as useQc } from "@tanstack/react-query"
import type { Destination } from "@chest-backup/shared"
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

const useBackups = (query: RunQuery = {}) => useQuery({ queryKey: ["backups", query], queryFn: () => fetchBackups(query) })

const useBackupStats = (query: RunQuery = {}) =>
  useQuery({ queryKey: ["backup-stats", query], queryFn: () => fetchBackupStats(query), refetchInterval: 15_000 })

const useBackupProgress = () =>
  useQuery({
    queryKey: ["backup-progress"],
    queryFn: fetchBackupProgress,
    refetchInterval: (query) => {
      const data = query.state.data

      if (data && ["idle", "completed", "failed"].includes(data.status)) return false

      return 1_000
    },
  })

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
  const qc = useQc()

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
