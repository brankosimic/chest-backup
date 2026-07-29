enum DaemonStatus {
  Idle = "idle",
  Running = "running",
  Success = "success",
  Error = "error",
}

interface DaemonOptions {
  onStateChange?: (status: DaemonStatus, message?: string) => void
  onNotify?: (title: string, body: string) => void
}

interface DaemonHandle {
  runBackupNow: () => Promise<void>
  stop: () => void
}

export { DaemonStatus, type DaemonOptions, type DaemonHandle }
