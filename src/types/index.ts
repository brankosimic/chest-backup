import type { Config, Source, Destination, DatabaseConfig, DiscordConfig, NotificationsConfig } from "./config"
import type { DestinationHandler, StoreResult } from "./destination"

interface VerifyResult {
  integrity: boolean
  checksum: string
  checksumFile: string
}

interface BackupResult {
  success: boolean
  timestamp: string
  archiveName?: string
  archiveSize?: number
  durationMs: number
  destinationResults: StoreResult[]
  errors: string[]
  verification?: VerifyResult
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
  VerifyResult,
  BackupResult,
}
