import { Hono } from "hono"
import { ScheduleSchema } from "../lib/validation"
import { getSchedule, updateSchedule } from "../lib/store"

const schedule = new Hono()

schedule.get("/", (c) => {
  const data = getSchedule()
  return c.json({ success: true, data })
})

schedule.put("/", (c) => {
  const body = c.req.jsonSync()
  const result = ScheduleSchema.safeParse(body)

  if (!result.success) {
    return c.json({ success: false, error: "Validation failed", message: result.error.issues[0]?.message }, 400)
  }

  const updated = updateSchedule(result.data)
  return c.json({ success: true, data: updated })
})

export { schedule }
