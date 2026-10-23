import type { RunStatus, RunTrigger } from "@chest-backup/shared"

type RunPhase = "queued" | "resolving" | "archiving" | "uploading" | "completed" | "failed"

type DestRunStatus = "pending" | "uploading" | "done" | "error" | "skipped"

interface DestRunProgress {
  id?: string
  name: string
  path: string
  type: string
  status: DestRunStatus
  speed?: number
  message?: string
  durationMs?: number
  startedAt?: string
  finishedAt?: string
}

interface RunSnapshot {
  runId: string
  status: RunStatus
  phase: RunPhase
  trigger: RunTrigger
  startedAt: string
  finishedAt?: string
  timestamp: string
  archiveSize?: number
  destinations: DestRunProgress[]
  filesChanged?: number
  filesBackedUp?: number
  totalUploadedBytes?: number
  durationMs?: number
  errors: string[]
}

export type { RunPhase, DestRunStatus, DestRunProgress, RunSnapshot }
