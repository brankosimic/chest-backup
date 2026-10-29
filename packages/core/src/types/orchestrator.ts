import type { RunTrigger } from "@chest-backup/shared"

interface RunContext {
  runId: string
  timestamp: string
  startedAt: string
  trigger: RunTrigger
}

export type { RunContext }
