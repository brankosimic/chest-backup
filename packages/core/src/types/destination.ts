import type SFTPClient from "ssh2-sftp-client"
import type { StoreResult } from "@chest-backup/shared"

type UploadProgress = {
  uploadedSize: number
  durationMs: number
  speed: number
}

enum UploadOutcomeKind {
  Uploaded = "uploaded",
  Vanished = "vanished",
  Failed = "failed",
}

type FileUploadResult = {
  path: string
  outcome: UploadOutcomeKind
}

type UploadOutcome = {
  uploaded: string[]
  failed: string[]
  vanished: string[]
  totalUploaded: number
  totalDuration: number
}

type DeleteOutcome = {
  deleted: string[]
  failed: number
}

interface UploadContext {
  sftp: SFTPClient
  base: string
  createdDirs: Set<string>
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

interface SftpUsage {
  totalSize: number
  fileCount: number
}

export {
  UploadOutcomeKind,
  type StoreResult,
  type UploadProgress,
  type FileUploadResult,
  type UploadOutcome,
  type DeleteOutcome,
  type UploadContext,
  type BackupProgressEvent,
  type BackupProgressCallback,
  type SftpUsage,
}
