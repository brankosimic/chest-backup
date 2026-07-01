import { Hono } from "hono"
import { NotificationsSchema } from "../lib/validation"
import { getNotifications, updateNotifications } from "../lib/store"
import { validateBody } from "../lib/routes"

const notifications = new Hono()

notifications.get("/", (c) => {
  const data = getNotifications()
  return c.json({ success: true, data })
})

notifications.put("/", (c) => {
  const result = validateBody(NotificationsSchema, c)
  if (!result.ok) return result.error
  const updated = updateNotifications(result.data)
  return c.json({ success: true, data: updated })
})

export { notifications }
