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

export type { ContainerVolume, BackupRunProgress, DestProgress }
