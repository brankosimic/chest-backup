import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Source, Destination } from "@chest-backup/shared"
import {
  fetchSources,
  fetchSource,
  createSource,
  updateSource,
  deleteSource,
  fetchDestinations,
  fetchDestination,
  createDestination,
  updateDestination,
  deleteDestination,
  fetchSchedule,
  updateSchedule,
  fetchRetention,
  updateRetention,
  fetchNotifications,
  updateNotifications,
  fetchBackups,
  fetchBackupStats,
  triggerBackup,
  fetchLogs,
  fetchSystem,
  testNotification,
} from "@/lib/api-client"

const useSources = () =>
  useQuery<Source[]>({ queryKey: ["sources"], queryFn: fetchSources })

const useSource = (id: string) =>
  useQuery<Source>({ queryKey: ["sources", id], queryFn: () => fetchSource(id), enabled: !!id })

const useCreateSource = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createSource(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["sources"] }) },
  })
}

const useUpdateSource = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateSource(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["sources"] }) },
  })
}

const useDeleteSource = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["sources"] }) },
  })
}

const useDestinations = () =>
  useQuery<Destination[]>({ queryKey: ["destinations"], queryFn: fetchDestinations })

const useDestination = (id: string) =>
  useQuery<Destination>({ queryKey: ["destinations", id], queryFn: () => fetchDestination(id), enabled: !!id })

const useCreateDestination = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createDestination(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["destinations"] }) },
  })
}

const useUpdateDestination = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateDestination(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["destinations"] }) },
  })
}

const useDeleteDestination = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDestination(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["destinations"] }) },
  })
}

const useSchedule = () =>
  useQuery({ queryKey: ["schedule"], queryFn: fetchSchedule })

const useUpdateSchedule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { schedule: string; enabled: boolean }) => updateSchedule(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["schedule"] }) },
  })
}

const useRetention = () =>
  useQuery({ queryKey: ["retention"], queryFn: fetchRetention })

const useUpdateRetention = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { globalRetention: number; destinations: { id: string; retention: number }[] }) => updateRetention(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["retention"] }) },
  })
}

const useNotifications = () =>
  useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications })

const useTestNotification = () =>
  useMutation({
    mutationFn: (webhookUrl: string) => testNotification(webhookUrl),
  })

const useUpdateNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { discord?: { webhookUrl: string; enabled: boolean } }) => updateNotifications(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["notifications"] }) },
  })
}

const useBackups = (page = 1, limit = 50) =>
  useQuery({ queryKey: ["backups", page, limit], queryFn: () => fetchBackups(page, limit) })

const useBackupStats = () =>
  useQuery({ queryKey: ["backup-stats"], queryFn: fetchBackupStats, refetchInterval: 10_000 })

const useTriggerBackup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: triggerBackup,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["backups"] })
      void qc.invalidateQueries({ queryKey: ["backup-stats"] })
    },
  })
}

const useLogs = (level?: string, search?: string) =>
  useQuery({ queryKey: ["logs", level, search], queryFn: () => fetchLogs(level, search) })

const useSystem = () =>
  useQuery({ queryKey: ["system"], queryFn: fetchSystem, refetchInterval: 10_000 })

export {
  useSources,
  useSource,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
  useDestinations,
  useDestination,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
  useSchedule,
  useUpdateSchedule,
  useRetention,
  useUpdateRetention,
  useNotifications,
  useUpdateNotifications,
  useBackups,
  useBackupStats,
  useTriggerBackup,
  useLogs,
  useSystem,
  useTestNotification,
}
