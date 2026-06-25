type TrayState = "idle" | "running" | "success" | "error"

interface TrayCallbacks {
  onRunNow: () => void
  onShowStatus: () => void
  onOpenConfig: () => void
  onViewLogs: () => void
  onQuit: () => void
}

export type { TrayState, TrayCallbacks }
