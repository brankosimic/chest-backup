import { Hono } from "hono"
import { RestoreRequestSchema } from "../lib/validation"
import { findDestinationById, getRetention } from "../lib/store"
import { getActiveRestoreJob, getRestoreJob, startRestoreJob } from "../lib/store/restore"
import { notFound, validateBody } from "../lib/routes"
import { assertSnapshotKey, countSnapshotFiles, listSnapshotFiles, listSnapshots } from "@core/restore/snapshots"
import { SFTP_SCAN_TIMEOUT_MS, withTimeout } from "../lib/utils"

const restores = new Hono()

restores.get("/snapshots", async (c) => {
  const destinationId = c.req.query("destinationId")
  if (!destinationId) return c.json({ success: false, error: "destinationId is required" }, 400)

  const destination = findDestinationById(destinationId)
  if (!destination) return notFound(c, "Destination")

  const { retentionMode } = getRetention()
  try {
    const data = await withTimeout(listSnapshots(destination, retentionMode), SFTP_SCAN_TIMEOUT_MS, [])
    return c.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to list snapshots: ${message}` }, 502)
  }
})

restores.get("/snapshots/:destinationId/count", async (c) => {
  const destination = findDestinationById(c.req.param("destinationId"))
  if (!destination) return notFound(c, "Destination")

  const periodKey = c.req.query("periodKey") ?? ""
  try {
    assertSnapshotKey(periodKey)
    const data = await withTimeout(countSnapshotFiles(destination, periodKey), SFTP_SCAN_TIMEOUT_MS, { fileCount: 0, totalSize: 0 })
    return c.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to count snapshot files: ${message}` }, 502)
  }
})

restores.get("/snapshots/:destinationId/:periodKey/files", async (c) => {
  const destination = findDestinationById(c.req.param("destinationId"))
  if (!destination) return notFound(c, "Destination")

  try {
    assertSnapshotKey(c.req.param("periodKey"))
  } catch (err) {
    return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 400)
  }

  const data = await listSnapshotFiles(destination, c.req.param("periodKey"))
  return c.json({ success: true, data })
})

restores.get("/active", (c) => c.json({ success: true, data: getActiveRestoreJob() }))

restores.get("/jobs/:id", (c) => {
  const job = getRestoreJob(c.req.param("id"))
  if (!job) return notFound(c, "Restore job")
  return c.json({ success: true, data: job })
})

restores.post("/", async (c) => {
  const result = await validateBody(RestoreRequestSchema, c)
  if (!result.ok) return result.error

  const destination = findDestinationById(result.data.destinationId)
  if (!destination) return notFound(c, "Destination")

  try {
    const job = startRestoreJob(
      destination,
      result.data.periodKey,
      {
        files: result.data.files,
        targetRoot: result.data.targetRoot,
        overwrite: result.data.overwrite,
        dryRun: result.data.dryRun,
      },
      getRetention().retentionMode,
    )
    return c.json({ success: true, data: job }, 202)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 409)
  }
})

export { restores }
