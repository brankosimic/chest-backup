import { Hono } from "hono"
import { SourceSchema } from "../lib/validation"
import { createSource, getSources, updateSource, deleteSource } from "../lib/store"
import { validateBody, notFound } from "../lib/routes"

const sources = new Hono()

sources.get("/", (c) => {
  const data = getSources()
  return c.json({ success: true, data })
})

sources.post("/", (c) => {
  const result = validateBody(SourceSchema, c)
  if (!result.ok) return result.error
  const source = createSource(result.data)
  return c.json({ success: true, data: source }, 201)
})

sources.put("/:id", (c) => {
  const id = c.req.param("id")
  const result = validateBody(SourceSchema, c)
  if (!result.ok) return result.error
  const updated = updateSource(id, result.data)
  if (!updated) return notFound(c, "Source")
  return c.json({ success: true, data: updated })
})

sources.delete("/:id", (c) => {
  const id = c.req.param("id")
  const deleted = deleteSource(id)
  if (!deleted) return notFound(c, "Source")
  return c.json({ success: true, message: "Source deleted" })
})

export { sources }
