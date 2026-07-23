type DestProgress = {
  name: string
  path: string
  type: string
  status: "pending" | "uploading" | "done" | "error" | "skipped"
  speed?: number
  message?: string
}

type BackupRunProgress = {
  status: "idle" | "archiving" | "running" | "completed" | "failed"
  startedAt: string
  timestamp: string
  archiveSize?: number
  destinations: DestProgress[]
}

export type { BackupRunProgress, DestProgress }
