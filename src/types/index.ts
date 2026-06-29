import type { Config, Source, Destination, DockerComposeSource, PostgresSource, PathSource, DiscordConfig, NotificationsConfig } from "./config"
import type { DestinationHandler, StoreResult } from "./destination"

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
  DockerComposeSource,
  Destination,
  DiscordConfig,
  NotificationsConfig,
  DestinationHandler,
  StoreResult,
  VerifyResult,
  CollectedSources,
  BackupResult,
}
