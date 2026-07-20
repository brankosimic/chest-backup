import { Hono } from "hono"
import { getBackups, getBackupById, getBackupStats, addLogEntry, invalidateBackupCache, persistBackupResult } from "../lib/store"
import { runBackup } from "@core/backup/orchestrator"
import { getActiveConfig } from "../lib/api-config"

const backups = new Hono()

backups.get("/", (c) => {
  const page = Number(c.req.query("page")) || 1
  const limit = Number(c.req.query("limit")) || 20
  const data = getBackups(page, limit)
  return c.json({ success: true, data })
})

backups.get("/stats", async (c) => {
  const data = await getBackupStats()
  return c.json({ success: true, data })
})

backups.get("/:id", (c) => {
  const id = c.req.param("id")
  const backup = getBackupById(id)

  if (!backup) {
    return c.json({ success: false, error: "Backup not found" }, 404)
  }

  return c.json({ success: true, data: backup })
})

backups.post("/run", async (c) => {
  const config = getActiveConfig()
  if (!config) {
    return c.json({ success: false, error: "No config loaded — cannot run backup" }, 500)
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const runTimestamp = `${timestamp.slice(0, 8)}-${timestamp.slice(8, 14)}`

  c.json(
    {
      success: true,
      message: "Backup triggered successfully",
      data: { triggered: true, timestamp: runTimestamp },
    },
    202,
  )

  runBackup(config)
    .then((result) => {
      invalidateBackupCache()
      persistBackupResult(result)
    })
    .catch((err: Error) => {
      addLogEntry({
        id: `log-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Manual backup failed: ${err.message}`,
        metadata: { error: err.message },
      })
    })
})

export { backups }
