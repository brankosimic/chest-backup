import { Hono } from "hono"
import { RetentionSchema } from "../lib/validation"
import { getRetention, updateRetention } from "../lib/store"
import { validateBody } from "../lib/routes"

const retention = new Hono()

retention.get("/", (c) => {
  const data = getRetention()
  return c.json({ success: true, data })
})

retention.put("/", (c) => {
  const result = validateBody(RetentionSchema, c)
  if (!result.ok) return result.error
  const updated = updateRetention(result.data)
  return c.json({ success: true, data: updated })
})

export { retention }
