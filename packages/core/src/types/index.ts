import type {
  Config,
  Source,
  Destination,
  ContainerVolumeSource,
  PostgresSource,
  PathSource,
  SqliteSource,
  SqliteContainerSource,
  DiscordConfig,
  NotificationsConfig,
} from "./config"
import type { StoreResult, BackupProgressEvent, BackupProgressCallback } from "./destination"
import type { FileStat } from "./manifest"

interface DestOutcome {
  result: StoreResult
  uploaded: FileStat[]
}

interface BackupSummary {
  filesChanged: number
  totalUploadedBytes: number
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
  filesBackedUp?: number
  filesChanged?: number
  totalUploadedBytes?: number
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
  DestOutcome,
  BackupSummary,
  StoreResult,
  VerifyResult,
  BackupResult,
  BackupProgressEvent,
  BackupProgressCallback,
}
