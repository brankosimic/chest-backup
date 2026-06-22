import type { Config, Source, Destination, DatabaseConfig, DiscordConfig, NotificationsConfig } from "./config"
import type { DestinationHandler, StoreResult } from "./destination"

interface BackupResult {
  success: boolean
  timestamp: string
  archiveName?: string
  archiveSize?: number
  durationMs: number
  destinationResults: StoreResult[]
  errors: string[]
}

export type {
  Config,
  Source,
  Destination,
  DatabaseConfig,
  DiscordConfig,
  NotificationsConfig,
  DestinationHandler,
  StoreResult,
  BackupResult,
}
