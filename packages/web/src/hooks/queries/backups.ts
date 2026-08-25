import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Destination } from "@chest-backup/shared"
import { fetchBackups, fetchBackupStats, fetchBackupProgress, triggerBackup, fetchLogs } from "@/lib/api-client"

const useBackups = (page = 1, limit = 50) =>
  useQuery({ queryKey: ["backups", page, limit], queryFn: () => fetchBackups(page, limit) })

const useBackupStats = () =>
  useQuery({ queryKey: ["backup-stats"], queryFn: fetchBackupStats, refetchInterval: 15_000 })

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
        status: "running",
        startedAt: new Date().toISOString(),
        timestamp: "",
        destinations: destinations.map((d) => ({
          name: d.name ?? d.path,
          path: d.path,
          type: d.type,
          status: "pending" as const,
        })),
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["backup-progress"] })
      void qc.invalidateQueries({ queryKey: ["backups"] })
      void qc.invalidateQueries({ queryKey: ["backup-stats"] })
    },
  })
}

const useLogs = (level?: string, search?: string) =>
  useQuery({ queryKey: ["logs", level, search], queryFn: () => fetchLogs(level, search) })

export { useBackups, useBackupStats, useBackupProgress, useTriggerBackup, useLogs }
