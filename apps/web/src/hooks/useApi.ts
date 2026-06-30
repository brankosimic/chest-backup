import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { DaemonStatus, ConfigView, BackupRecord, DashboardStats } from "@chest-backup/shared"
import { fetchStatus, fetchConfig, fetchHistory, fetchStats, fetchLogs, triggerBackup } from "@/utils/api"

const useStatus = () =>
  useQuery<DaemonStatus>({ queryKey: ["status"], queryFn: fetchStatus, refetchInterval: 10_000 })

const useConfig = () =>
  useQuery<ConfigView>({ queryKey: ["config"], queryFn: fetchConfig })

const useHistory = () =>
  useQuery<BackupRecord[]>({ queryKey: ["history"], queryFn: fetchHistory })

const useStats = () =>
  useQuery<DashboardStats>({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 10_000 })

const useLogs = () =>
  useQuery<{ lines: string[] }>({ queryKey: ["logs"], queryFn: fetchLogs })

const useTriggerBackup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: triggerBackup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["status"] })
      void queryClient.invalidateQueries({ queryKey: ["history"] })
      void queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export { useStatus, useConfig, useHistory, useStats, useLogs, useTriggerBackup }
