import type { PaginatedResult, BackupStats } from "../../types/api"
import { seedLogsFromHistory, parseTimestamp, addLogEntry, getLogs } from "./logs"
import { getSystem } from "./system"
import { getSources, findSourceById, createSource, updateSource, deleteSource } from "./entities"
import { getDestinations, findDestinationById, createDestination, updateDestination, deleteDestination } from "./entities"
import { getSchedule, updateSchedule, getRetention, updateRetention, getNotifications, updateNotifications } from "./settings"
import { getBackups, getBackupById, getBackupStats, addBackupRecord, invalidateBackupCache } from "./backups"
import { persistBackupResult } from "./backup-result"

export {
  type PaginatedResult,
  type BackupStats,
  seedLogsFromHistory,
  addBackupRecord,
  addLogEntry,
  createDestination,
  getLogs,
  createSource,
  deleteDestination,
  deleteSource,
  findDestinationById,
  findSourceById,
  getBackups,
  getBackupById,
  getBackupStats,
  getDestinations,
  getNotifications,
  getRetention,
  getSchedule,
  getSources,
  getSystem,
  invalidateBackupCache,
  parseTimestamp,
  persistBackupResult,
  updateDestination,
  updateNotifications,
  updateRetention,
  updateSchedule,
  updateSource,
}
