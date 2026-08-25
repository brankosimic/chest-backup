interface DestProgress {
  name: string
  path: string
  type: string
  status: "pending" | "uploading" | "done" | "error" | "skipped"
  speed?: number
  message?: string
}

interface BackupRunProgress {
  status: "idle" | "archiving" | "running" | "completed" | "failed"
  startedAt: string
  timestamp: string
  archiveSize?: number
  destinations: DestProgress[]
}

interface ContainerVolume {
  type: string
  source: string
  destination: string
  name?: string
  rw: boolean
}

import type { Destination } from "@chest-backup/shared"

interface DestCardProps {
  destination: Destination
}

interface DestinationUsage {
  type: string
  name?: string
  path: string
  totalSize: number
  fileCount: number
  avgDurationMs: number
  available: boolean
}

interface BadgeProps {
  variant: "success" | "destructive" | "default" | "secondary" | "outline"
  labelKey: string
}

export type { ContainerVolume, BackupRunProgress, DestProgress, DestCardProps, DestinationUsage, BadgeProps }
