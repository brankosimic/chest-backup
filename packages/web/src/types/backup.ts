import type { ReactNode } from "react"
import type { BackupRecord, Destination, DestinationType, RunStatus, RunTrigger } from "@chest-backup/shared"

enum RunPhase {
  Queued = "queued",
  Resolving = "resolving",
  Archiving = "archiving",
  Uploading = "uploading",
  Completed = "completed",
  Failed = "failed",
}

enum DestRunStatus {
  Pending = "pending",
  Uploading = "uploading",
  Done = "done",
  Error = "error",
  Skipped = "skipped",
}

enum StatTileTone {
  Default = "default",
  Success = "success",
  Warning = "warning",
  Destructive = "destructive",
}

interface DestProgress {
  id?: string
  name: string
  path: string
  type: DestinationType
  status: DestRunStatus
  speed?: number
  message?: string
  durationMs?: number
  startedAt?: string
  finishedAt?: string
}

interface BackupRunProgress {
  runId: string
  status: RunStatus
  phase: RunPhase
  trigger: RunTrigger
  startedAt: string
  finishedAt?: string
  timestamp: string
  archiveSize?: number
  destinations: DestProgress[]
  filesChanged?: number
  filesBackedUp?: number
  totalUploadedBytes?: number
  durationMs?: number
  errors: string[]
}

interface ContainerVolume {
  type: string
  source: string
  destination: string
  name?: string
  rw: boolean
}

interface DestCardProps {
  destination: Destination
}

interface DiskSpace {
  used: number
  total: number
}

interface DestinationUsage {
  type: string
  name?: string
  path: string
  totalSize: number
  fileCount: number
  avgDurationMs: number
  available: boolean
  diskSpace?: DiskSpace
}

interface StatTileProps {
  title: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: StatTileTone
}

interface RecentActivityProps {
  runs: BackupRecord[]
  loading?: boolean
  limit?: number
}

interface HealthStripProps {
  runs: BackupRecord[]
  className?: string
}

interface RunStatusBadgeProps {
  status?: RunStatus
  className?: string
}

interface TriggerBadgeProps {
  trigger: RunTrigger
  className?: string
}

export { RunPhase, DestRunStatus, StatTileTone }
export type {
  ContainerVolume,
  BackupRunProgress,
  DestProgress,
  DestCardProps,
  DestinationUsage,
  StatTileProps,
  RecentActivityProps,
  HealthStripProps,
  RunStatusBadgeProps,
  TriggerBadgeProps,
}
