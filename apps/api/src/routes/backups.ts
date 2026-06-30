import { Hono } from "hono"
import { getBackups, getBackupById, getBackupStats } from "../lib/store"

const backups = new Hono()

backups.get("/", (c) => {
  const page = Number(c.req.query("page")) || 1
  const limit = Number(c.req.query("limit")) || 20
  const data = getBackups(page, limit)
  return c.json({ success: true, data })
})

backups.get("/stats", (c) => {
  const data = getBackupStats()
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

backups.post("/run", (c) => {
  return c.json(
    {
      success: true,
      message: "Backup triggered successfully",
      data: { triggered: true, timestamp: new Date().toISOString() },
    },
    202,
  )
})

export { backups }
