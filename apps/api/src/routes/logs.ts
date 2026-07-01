import { Hono } from "hono"
import { getLogs } from "../lib/store"

const logs = new Hono()

logs.get("/", (c) => {
  const level = c.req.query("level")
  const search = c.req.query("search")
  const page = Number(c.req.query("page")) || 1
  const limit = Number(c.req.query("limit")) || 50
  const data = getLogs(level, search, page, limit)
  return c.json({ success: true, data })
})

export { logs }
