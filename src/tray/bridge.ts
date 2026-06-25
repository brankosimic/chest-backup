import { Tray } from "@trayjs/trayjs"
import type { MenuItem } from "@trayjs/trayjs"
import { resolve } from "node:path"
import { execSync } from "node:child_process"
import { logger } from "../utils/logger"
import type { TrayState, TrayCallbacks } from "../types/tray"

const ICONS_DIR = resolve(import.meta.dirname)

const STATE_ICONS: Record<TrayState, string> = {
  idle: resolve(ICONS_DIR, "icon_idle.png"),
  running: resolve(ICONS_DIR, "icon_running.png"),
  success: resolve(ICONS_DIR, "icon_success.png"),
  error: resolve(ICONS_DIR, "icon_error.png"),
}

class TrayBridge {
  private tray: Tray | null = null
  private state: TrayState = "idle"

  async start(callbacks: TrayCallbacks): Promise<void> {
    const iconPath = STATE_ICONS.idle
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
        logger.info("system tray icon ready")
        resolve_()
      })
    })
  }

  setState(state: TrayState, message?: string): void {
    this.state = state

    if (!this.tray) return

    const iconPath = STATE_ICONS[state]
    this.tray.setIcon({ png: iconPath, ico: iconPath })
    this.tray.setTooltip(`Chest Backup — ${message ?? state}`)
  }

  notify(title: string, text: string): void {
    try {
      execSync(`notify-send --app-name="Chest Backup" --icon=dialog-information "${title}" "${text}"`, {
        timeout: 3000,
      })
    } catch {
      logger.debug("desktop notification failed")
    }
  }

  stop(): void {
    this.tray?.quit()
    this.tray = null
    this.state = "idle"
  }

  private buildMenu(): MenuItem[] {
    const isRunning = this.state === "running"

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
