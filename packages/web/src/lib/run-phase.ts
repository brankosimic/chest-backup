import { RunPhase } from "@/types/backup"

const ACTIVE_RUN_PHASES = [RunPhase.Queued, RunPhase.Resolving, RunPhase.Archiving, RunPhase.Uploading]
const TERMINAL_RUN_PHASES = [RunPhase.Completed, RunPhase.Failed]

const isActiveRunPhase = (phase: RunPhase): boolean => ACTIVE_RUN_PHASES.includes(phase)
const isTerminalRunPhase = (phase: RunPhase): boolean => TERMINAL_RUN_PHASES.includes(phase)

export { isActiveRunPhase, isTerminalRunPhase }
