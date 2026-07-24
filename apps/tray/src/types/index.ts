interface TrayCallbacks {
  onRunNow: () => void
  onShowStatus: () => void
  onOpenConfig: () => void
  onViewLogs: () => void
  onQuit: () => void
}

export type { TrayCallbacks }
