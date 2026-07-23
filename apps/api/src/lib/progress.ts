import type { BackupProgressEvent } from "@core/types/index"

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

let currentProgress: BackupRunProgress = {
  status: "idle",
  startedAt: "",
  timestamp: "",
  destinations: [],
}

const startBackup = (destinations: { name?: string; path: string; type: string }[], timestamp: string): void => {
  currentProgress = {
    status: "running",
    startedAt: new Date().toISOString(),
    timestamp,
    destinations: destinations.map((d) => ({
      name: d.name ?? d.path,
      path: d.path,
      type: d.type,
      status: "pending" as const,
    })),
  }
}

const getProgress = (): BackupRunProgress => currentProgress

const updateFromEvent = (event: BackupProgressEvent): void => {
  if (event.phase === "archiving") {
    currentProgress.status = "archiving"
    if (event.archiveSize) currentProgress.archiveSize = event.archiveSize
    return
  }

  const destName = event.destName ?? event.destPath ?? ""
  const dest = currentProgress.destinations.find((d) => d.name === destName || d.path === destName)
  if (!dest) return

  if (event.destType) dest.type = event.destType

  switch (event.phase) {
    case "destination-start":
      dest.status = "uploading"
      break
    case "destination-done":
      dest.status = event.message === "skipped" ? "skipped" : "done"
      if (event.speed) dest.speed = event.speed
      break
    case "destination-error":
      dest.status = "error"
      dest.message = event.message
      break
  }
}

const completeBackup = (success: boolean): void => {
  currentProgress.status = success ? "completed" : "failed"
}

const clearProgress = (): void => {
  currentProgress = {
    status: "idle",
    startedAt: "",
    timestamp: "",
    destinations: [],
  }
}

export { startBackup, getProgress, updateFromEvent, completeBackup, clearProgress }
export type { BackupRunProgress, DestProgress }
