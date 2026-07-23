import type { Destination } from "./config"
import type { StoreResult } from "@chest-backup/shared"

type UploadProgress = {
  uploadedSize: number
  durationMs: number
  speed: number
}

interface DestinationHandler {
  store(archivePath: string, dest: Destination): Promise<StoreResult>
  prune(dest: Destination, prefix: string, globalRetention: number): Promise<void>
}

type ProgressPhase = "archiving" | "destination-start" | "destination-done" | "destination-error"

interface BackupProgressEvent {
  phase: ProgressPhase
  destName?: string
  destPath?: string
  destType?: string
  speed?: number
  archiveSize?: number
  message?: string
}

type BackupProgressCallback = (event: BackupProgressEvent) => void

export type { DestinationHandler, StoreResult, UploadProgress, BackupProgressEvent, BackupProgressCallback }
