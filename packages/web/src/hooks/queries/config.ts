import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ScheduleUpdateData, RetentionUpdateData, NotificationUpdateData, ExcludeUpdateData } from "@/types/mutations"
import {
  fetchSchedule,
  updateSchedule,
  fetchRetention,
  updateRetention,
  fetchNotifications,
  updateNotifications,
  testNotification,
  fetchExclude,
  updateExclude,
} from "@/lib/api-client"

const useSchedule = () => useQuery({ queryKey: ["schedule"], queryFn: fetchSchedule })

const useUpdateSchedule = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: ScheduleUpdateData) => updateSchedule(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}

const useRetention = () => useQuery({ queryKey: ["retention"], queryFn: fetchRetention })

const useUpdateRetention = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: RetentionUpdateData) => updateRetention(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["retention"] })
    },
  })
}

const useNotifications = () => useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications })

const useTestNotification = () =>
  useMutation({
    mutationFn: (webhookUrl: string) => testNotification(webhookUrl),
  })

const useUpdateNotifications = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: NotificationUpdateData) => updateNotifications(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

const useExclude = () => useQuery({ queryKey: ["exclude"], queryFn: fetchExclude })

const useUpdateExclude = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: ExcludeUpdateData) => updateExclude(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["exclude"] })
      void qc.invalidateQueries({ queryKey: ["source-exclusions"] })
    },
  })
}

export {
  useSchedule,
  useUpdateSchedule,
  useRetention,
  useUpdateRetention,
  useNotifications,
  useTestNotification,
  useUpdateNotifications,
  useExclude,
  useUpdateExclude,
}
