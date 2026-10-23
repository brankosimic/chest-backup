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
import type { RunOptions } from "./run"
import type { RunTrigger } from "@chest-backup/shared"

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
  runId: string
  /** Wall-clock local stamp (YYYYMMDD-HHMMSS) used for archive and period naming. */
  timestamp: string
  /** Real UTC instant the run started. */
  startedAt: string
  /** Real UTC instant the run finished. */
  finishedAt: string
  trigger: RunTrigger
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
  RunOptions,
  BackupProgressEvent,
  BackupProgressCallback,
}
