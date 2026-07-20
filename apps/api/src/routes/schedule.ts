import { Hono } from "hono"
import { ScheduleSchema } from "../lib/validation"
import { getSchedule, updateSchedule } from "../lib/store"
import { validateBody } from "../lib/routes"

const schedule = new Hono()

schedule.get("/", (c) => {
  const data = getSchedule()
  return c.json({ success: true, data })
})

schedule.put("/", async (c) => {
  const result = await validateBody(ScheduleSchema, c)
  if (!result.ok) return result.error
  const updated = updateSchedule(result.data)
  return c.json({ success: true, data: updated })
})

export { schedule }
