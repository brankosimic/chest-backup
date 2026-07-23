import type { Config, Source, Destination, ContainerVolumeSource, PostgresSource, PathSource, SqliteSource, SqliteContainerSource, DiscordConfig, NotificationsConfig } from "./config"
import type { DestinationHandler, StoreResult, BackupProgressEvent, BackupProgressCallback } from "./destination"

interface CollectedSources {
  sources: string[]
  dbDumps: string[]
}

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
  PathSource,
  PostgresSource,
  SqliteSource,
  SqliteContainerSource,
  ContainerVolumeSource,
  Destination,
  DiscordConfig,
  NotificationsConfig,
  DestinationHandler,
  StoreResult,
  VerifyResult,
  CollectedSources,
  BackupResult,
  BackupProgressEvent,
  BackupProgressCallback,
}
