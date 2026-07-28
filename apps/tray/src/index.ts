import { execSync, spawn } from "node:child_process"
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

  const daemon = await createDaemon(undefined, daemonOptions)

  await tray.start({
    onRunNow: () => {
      void daemon.runBackupNow()
    },
    onShowStatus: () => {
      tray.notify("Chest Backup", "Daemon is running. Click Run Backup Now to start a manual backup.")
    },
    onOpenConfig: () => {
      try {
        execSync("xdg-open ./chest-backup.json", { timeout: 3000 })
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
