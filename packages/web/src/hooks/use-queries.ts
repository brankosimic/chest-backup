import { useSources, useSource, useCreateSource, useUpdateSource, useDeleteSource } from "./queries/sources"
import {
  useDestinations,
  useDestinationUsage,
  useDestination,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
} from "./queries/destinations"
import {
  useSchedule,
  useUpdateSchedule,
  useRetention,
  useUpdateRetention,
  useNotifications,
  useUpdateNotifications,
  useTestNotification,
} from "./queries/config"
import { useBackups, useBackupStats, useBackupProgress, useTriggerBackup, useLogs } from "./queries/backups"
import { useSystem } from "./queries/system"

export {
  useSources,
  useSource,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
  useDestinations,
  useDestinationUsage,
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
  useTestNotification,
  useBackups,
  useBackupStats,
  useBackupProgress,
  useTriggerBackup,
  useLogs,
  useSystem,
}
