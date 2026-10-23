import type { RunTrigger } from "@chest-backup/shared"

interface RunOptions {
  runId?: string
  trigger?: RunTrigger
}

export type { RunOptions }
