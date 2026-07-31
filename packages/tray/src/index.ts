import { execSync, spawn } from "node:child_process"
import { homedir } from "node:os"
import { resolve } from "node:path"
import { createDaemon } from "@core/daemon"
import type { DaemonOptions } from "@core/daemon"
import { TrayBridge } from "./tray/bridge"

const main = async (): Promise<void> => {
  process.title = "chest-backup-tray"

  const tray = new TrayBridge()

  const daemonOptions: DaemonOptions = {
    onStateChange: (status, message) => {
      tray.setState(status, message)
    },
    onNotify: (title, body) => {
      tray.notify(title, body)
    },
  }

  const daemon = createDaemon(undefined, daemonOptions)

  await tray.start({
    onRunNow: () => {
      void daemon.runBackupNow()
    },
    onShowStatus: () => {
      tray.notify("Chest Backup", "Daemon is running. Click Run Backup Now to start a manual backup.")
    },
    onOpenConfig: () => {
      const configPath = process.env.CHEST_CONFIG_PATH ?? resolve(homedir(), ".config/chest-backup/chest-backup.json")
      try {
        execSync(`xdg-open "${configPath}"`, { timeout: 3000 })
      } catch {
        console.debug("failed to open config file")
      }
    },
    onViewLogs: () => {
      const child = spawn(
        "konsole",
        ["--hold", "-e", "journalctl", "--user", "-u", "chest-backup", "-n", "50", "-f", "--no-pager"],
        {
          detached: true,
          stdio: "ignore",
        },
      )
      child.unref()
    },
    onQuit: () => {
      daemon.stop()
    },
  })

  await new Promise(() => {})
}

await main()
