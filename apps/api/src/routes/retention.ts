import { Hono } from "hono"
import { RetentionSchema } from "../lib/validation"
import { getRetention, updateRetention } from "../lib/store"

const retention = new Hono()

retention.get("/", (c) => {
  const data = getRetention()
  return c.json({ success: true, data })
})

retention.put("/", (c) => {
  const body = c.req.jsonSync()
  const result = RetentionSchema.safeParse(body)

  if (!result.success) {
    return c.json({ success: false, error: "Validation failed", message: result.error.issues[0]?.message }, 400)
  }

  const updated = updateRetention(result.data)
  return c.json({ success: true, data: updated })
})

export { retention }
