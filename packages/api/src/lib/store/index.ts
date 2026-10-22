import type { PaginatedResult, BackupStats } from "../../types/api"
import { seedLogsFromHistory, parseTimestamp, addLogEntry, getLogs, pushLog } from "./logs"
import { getSystem } from "./system"
import { getSources, findSourceById, createSource, updateSource, deleteSource } from "./entities"
import {
  getDestinations,
  findDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} from "./entities"
import {
  getSchedule,
  updateSchedule,
  getRetention,
  updateRetention,
  getExclude,
  updateExclude,
  getNotifications,
  updateNotifications,
} from "./settings"
import { getSourceExclusions } from "./exclusions"
import { getBackups, getBackupById, getBackupStats, getDestinationUsage, addBackupRecord, invalidateBackupCache } from "./backups"
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
  getDestinationUsage,
  getDestinations,
  getExclude,
  getNotifications,
  getRetention,
  getSchedule,
  getSourceExclusions,
  getSources,
  getSystem,
  invalidateBackupCache,
  parseTimestamp,
  persistBackupResult,
  pushLog,
  updateDestination,
  updateExclude,
  updateNotifications,
  updateRetention,
  updateSchedule,
  updateSource,
}
