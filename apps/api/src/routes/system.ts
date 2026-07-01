import { Hono } from "hono"
import { getSystem } from "../lib/store"

const system = new Hono()

system.get("/", (c) => {
  const data = getSystem()
  return c.json({ success: true, data })
})

system.get("/health", (c) => {
  return c.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } })
})

export { system }
