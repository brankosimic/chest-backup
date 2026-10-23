import { Hono } from "hono"
import { getLogs, getLogStats, clearLogs } from "../lib/store"
import { parseLogQuery } from "../lib/query"

const logs = new Hono()

logs.get("/", (c) => {
  return c.json({ success: true, data: getLogs(parseLogQuery(c)) })
})

logs.get("/stats", (c) => {
  return c.json({ success: true, data: getLogStats() })
})

logs.delete("/", (c) => {
  clearLogs()
  return c.json({ success: true, data: { cleared: true } })
})

export { logs }
