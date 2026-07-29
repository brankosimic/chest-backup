import { Tray } from "@trayjs/trayjs"
import type { MenuItem } from "@trayjs/trayjs"
import { resolve } from "node:path"
import { execSync } from "node:child_process"
import { DaemonStatus } from "@core/daemon"
import type { TrayCallbacks } from "../types"

const ICONS_DIR = resolve(import.meta.dirname)

const STATE_ICONS: Partial<Record<DaemonStatus, string>> = {
  [DaemonStatus.Idle]: resolve(ICONS_DIR, "icon_idle.png"),
  [DaemonStatus.Running]: resolve(ICONS_DIR, "icon_running.png"),
  [DaemonStatus.Success]: resolve(ICONS_DIR, "icon_success.png"),
  [DaemonStatus.Error]: resolve(ICONS_DIR, "icon_error.png"),
}

class TrayBridge {
  private tray: Tray | null = null
  private state: DaemonStatus = DaemonStatus.Idle

  async start(callbacks: TrayCallbacks): Promise<void> {
    const iconPath = STATE_ICONS[DaemonStatus.Idle] ?? resolve(ICONS_DIR, "icon_idle.png")
    const tray = new Tray({
      tooltip: "Chest Backup — Idle",
      icon: { png: iconPath, ico: iconPath },
      onMenuRequested: () => this.buildMenu(),
      onClicked: (id: string) => {
        this.handleClick(id, callbacks)
      },
    })

    this.tray = tray

    return new Promise<void>((resolve_) => {
      tray.on("ready", () => {
        console.log("system tray icon ready")
        resolve_()
      })
    })
  }

  setState(state: DaemonStatus, message?: string): void {
    this.state = state
    if (!this.tray) return

    const iconPath = STATE_ICONS[state]
    if (iconPath) {
      this.tray.setIcon({ png: iconPath, ico: iconPath })
    }
    this.tray.setTooltip(`Chest Backup — ${message ?? state}`)
  }

  notify(title: string, text: string): void {
    try {
      execSync(`notify-send --app-name="Chest Backup" --icon=dialog-information "${title}" "${text}"`, {
        timeout: 3000,
      })
    } catch {
      console.debug("desktop notification failed")
    }
  }

  stop(): void {
    this.tray?.quit()
    this.tray = null
    this.state = DaemonStatus.Idle
  }

  private buildMenu(): MenuItem[] {
    const isRunning = this.state === DaemonStatus.Running

    return [
      { id: "run_now", title: "Run Backup Now", enabled: !isRunning },
      { id: "show_status", title: "Show Status" },
      { id: "sep1", separator: true },
      { id: "open_config", title: "Open Config" },
      { id: "view_logs", title: "View Logs" },
      { id: "sep2", separator: true },
      { id: "quit", title: "Quit" },
    ]
  }

  private handleClick(id: string, callbacks: TrayCallbacks): void {
    switch (id) {
      case "run_now":
        callbacks.onRunNow()
        break
      case "show_status":
        callbacks.onShowStatus()
        break
      case "open_config":
        callbacks.onOpenConfig()
        break
      case "view_logs":
        callbacks.onViewLogs()
        break
      case "quit":
        callbacks.onQuit()
        break
    }
  }
}

export { TrayBridge }
