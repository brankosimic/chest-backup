import { addLogEntry, getLogs, getLogStats, clearLogs, flushLogs } from "./logs"
import { getSystem } from "./system"
import { getSources, findSourceById, createSource, updateSource, deleteSource } from "./sources"
import { getDestinations, findDestinationById, createDestination, updateDestination, deleteDestination } from "./destinations"
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
import {
  getBackups,
  getBackupById,
  getBackupStats,
  getDestinationUsage,
  addBackupRecord,
  invalidateBackupCache,
} from "./backups"
import { persistBackupResult } from "./backup-result"

export {
  addBackupRecord,
  addLogEntry,
  clearLogs,
  createDestination,
  flushLogs,
  getLogStats,
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
  persistBackupResult,
  updateDestination,
  updateExclude,
  updateNotifications,
  updateRetention,
  updateSchedule,
  updateSource,
}
