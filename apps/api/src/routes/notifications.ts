import { Hono } from "hono"
import { NotificationsSchema } from "../lib/validation"
import { getNotifications, updateNotifications } from "../lib/store"

const notifications = new Hono()

notifications.get("/", (c) => {
  const data = getNotifications()
  return c.json({ success: true, data })
})

notifications.put("/", (c) => {
  const body = c.req.jsonSync()
  const result = NotificationsSchema.safeParse(body)

  if (!result.success) {
    return c.json({ success: false, error: "Validation failed", message: result.error.issues[0]?.message }, 400)
  }

  const updated = updateNotifications(result.data)
  return c.json({ success: true, data: updated })
})

export { notifications }
