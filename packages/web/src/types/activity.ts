import type { ReactNode } from "react"
import type {
  BackupRecord,
  Destination,
  LogEntry,
  LogLevel,
  RunStats,
  RunStatus,
  RunTrigger,
  StoreResult,
} from "@chest-backup/shared"
import { RunSort } from "./api"
import type { BackupRunProgress } from "./backup"
import type { BadgeVariant } from "./ui"

enum ActivityTab {
  Runs = "runs",
  Logs = "logs",
}

enum TimeRange {
  All = "all",
  Day = "24h",
  Week = "7d",
  Month = "30d",
  Quarter = "90d",
}

enum DestOutcome {
  Done = "done",
  Error = "error",
  Skipped = "skipped",
  Pending = "pending",
}

enum SummaryTone {
  Default = "default",
  Success = "success",
  Warning = "warning",
  Destructive = "destructive",
  Muted = "muted",
}

interface ActivityFiltersState {
  search: string
  status: RunStatus | null
  trigger: RunTrigger | null
  destinationId: string | null
  range: TimeRange
  sort: RunSort
}

interface ActivityFiltersProps {
  value: ActivityFiltersState
  onChange: (value: ActivityFiltersState) => void
  destinations: Destination[]
}

interface StatusMeta {
  labelKey: string
  variant: BadgeVariant
  icon: ReactNode
  dot: string
}

interface RunsTableProps {
  runs: BackupRecord[]
  loading?: boolean
  onSelect: (run: BackupRecord) => void
}

interface RunDetailSheetProps {
  run: BackupRecord | null
  open: boolean
  onClose: () => void
}

interface LogViewerProps {
  entries: LogEntry[]
  emptyLabel: string
  follow?: boolean
  className?: string
}

interface SummaryStripProps {
  stats: RunStats | undefined
  loading?: boolean
}

interface DestResultProps {
  result: StoreResult
}

interface LogLevelOption {
  value: LogLevel
  label: string
}

interface StreamState {
  logs: LogEntry[]
  run: BackupRunProgress | null
  connected: boolean
  lastEventAt: string | null
}

export { ActivityTab, TimeRange, DestOutcome, SummaryTone }
export type {
  ActivityFiltersState,
  ActivityFiltersProps,
  StatusMeta,
  RunsTableProps,
  RunDetailSheetProps,
  LogViewerProps,
  SummaryStripProps,
  DestResultProps,
  LogLevelOption,
  StreamState,
}
