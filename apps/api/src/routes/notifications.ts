import { Hono } from "hono"
import { NotificationsSchema } from "../lib/validation"
import { getNotifications, updateNotifications } from "../lib/store"
import { validateBody } from "../lib/routes"

const notifications = new Hono()

notifications.get("/", (c) => {
  const data = getNotifications()
  return c.json({ success: true, data })
})

notifications.put("/", async (c) => {
  const result = await validateBody(NotificationsSchema, c)
  if (!result.ok) return result.error
  const updated = updateNotifications(result.data)
  return c.json({ success: true, data: updated })
})

notifications.post("/test", async (c) => {
  const body = await c.req.json<{ webhookUrl: string }>()
  if (!body.webhookUrl || !body.webhookUrl.startsWith("https://")) return c.json({ success: false, error: "Valid webhook URL is required" })

  try {
    const response = await fetch(body.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "Test Notification",
          description: "This is a test notification from Chest-Backup.",
          color: 0x00ff00,
          timestamp: new Date().toISOString(),
        }],
      }),
    })

    if (!response.ok) return c.json({ success: false, error: `Discord returned status ${response.status}` })

    return c.json({ success: true, message: "Test notification sent successfully" })
  } catch (err) {
    return c.json({ success: false, error: err instanceof Error ? err.message : "Failed to send test notification" })
  }
})

export { notifications }
