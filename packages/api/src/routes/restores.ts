import { Hono } from "hono"
import { RestoreRequestSchema } from "../lib/validation"
import { findDestinationById, getRetention } from "../lib/store"
import { getActiveRestoreJob, getRestoreJob, startRestoreJob } from "../lib/store/restore"
import { notFound, validateBody } from "../lib/routes"
import { assertSnapshotKey, listSnapshotFiles, listSnapshots } from "@core/restore/snapshots"

const restores = new Hono()

restores.get("/snapshots", async (c) => {
  const destinationId = c.req.query("destinationId")
  if (!destinationId) return c.json({ success: false, error: "destinationId is required" }, 400)

  const destination = findDestinationById(destinationId)
  if (!destination) return notFound(c, "Destination")

  const { retentionMode } = getRetention()
  const data = await listSnapshots(destination, retentionMode)
  return c.json({ success: true, data })
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
