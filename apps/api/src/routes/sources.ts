import { Hono } from "hono"
import { z } from "zod"
import { SourceSchema } from "../lib/validation"
import { createSource, getSources, updateSource, deleteSource } from "../lib/store"

const sources = new Hono()

sources.get("/", (c) => {
  const data = getSources()
  return c.json({ success: true, data })
})

sources.post("/", (c) => {
  const body = c.req.jsonSync()
  const result = SourceSchema.safeParse(body)

  if (!result.success) {
    return c.json({ success: false, error: "Validation failed", message: result.error.issues[0]?.message }, 400)
  }

  const source = createSource(result.data)
  return c.json({ success: true, data: source }, 201)
})

sources.put("/:id", (c) => {
  const id = c.req.param("id")
  const body = c.req.jsonSync()

  const updated = updateSource(id, body)
  if (!updated) {
    return c.json({ success: false, error: "Source not found" }, 404)
  }

  return c.json({ success: true, data: updated })
})

sources.delete("/:id", (c) => {
  const id = c.req.param("id")
  const deleted = deleteSource(id)

  if (!deleted) {
    return c.json({ success: false, error: "Source not found" }, 404)
  }

  return c.json({ success: true, message: "Source deleted" })
})

export { sources }
