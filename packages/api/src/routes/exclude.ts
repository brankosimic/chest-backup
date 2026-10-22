import { Hono } from "hono"
import { ExcludeSchema } from "../lib/validation"
import { getExclude, updateExclude } from "../lib/store"
import { validateBody } from "../lib/routes"

const exclude = new Hono()

exclude.get("/", (c) => {
  const data = getExclude()
  return c.json({ success: true, data })
})

exclude.put("/", async (c) => {
  const result = await validateBody(ExcludeSchema, c)
  if (!result.ok) return result.error
  const updated = updateExclude(result.data)
  return c.json({ success: true, data: updated })
})

export { exclude }
