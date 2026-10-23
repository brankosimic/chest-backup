import { Hono } from "hono"
import { serveStatic } from "@hono/bun"
import { resolve } from "node:path"
import { cors } from "./middleware/cors"
import { errorHandling } from "./middleware/error"
import { host as HOST, port as PORT } from "./env"
import { backups } from "./routes/backups"
import { destinations } from "./routes/destinations"
import { exclude } from "./routes/exclude"
import { logs } from "./routes/logs"
import { notifications } from "./routes/notifications"
import { retention } from "./routes/retention"
import { schedule } from "./routes/schedule"
import { sources } from "./routes/sources"
import { system } from "./routes/system"
import { events } from "./routes/events"

import { loadConfigForApi, loadAndStartDaemon } from "./lib/api-config"
import { addLogEntry, flushLogs } from "./lib/store"
import { subscribeToLogs, currentRunId } from "@core/utils/logger"
import { LogLevel } from "@chest-backup/shared"
import type { LogRecord } from "@core/utils/logger"

const WEB_DIST = process.env.WEB_DIST_PATH ?? resolve(import.meta.dirname, "../../web/dist")

const RESERVED_KEYS = new Set(["level", "time", "msg", "pid", "hostname"])

const PINO_LEVELS: Record<number, LogLevel> = {
  10: LogLevel.Debug,
  20: LogLevel.Debug,
  30: LogLevel.Info,
  40: LogLevel.Warn,
  50: LogLevel.Error,
  60: LogLevel.Fatal,
}

const toMetadata = (record: LogRecord): Record<string, unknown> =>
  Object.entries(record)
    .filter(([key]) => !RESERVED_KEYS.has(key))
    .reduce<Record<string, unknown>>((metadata, [key, value]) => {
      metadata[key] = value
      return metadata
    }, {})

const captureEngineLogs = (): void => {
  subscribeToLogs((record) => {
    const runId = currentRunId()
    addLogEntry({
      id: "",
      timestamp: new Date(record.time ?? Date.now()).toISOString(),
      level: PINO_LEVELS[record.level] ?? LogLevel.Info,
      message: record.msg ?? "",
      ...(runId ? { runId } : {}),
      metadata: toMetadata(record),
    })
  })
}

const app = new Hono()

app.use("*", cors)
app.use("*", errorHandling)
app.use("*", async (c, next) => {
  await next()
  c.header("Cache-Control", "no-cache")
})

app.route("/api/sources", sources)
app.route("/api/destinations", destinations)
app.route("/api/schedule", schedule)
app.route("/api/retention", retention)
app.route("/api/exclude", exclude)
app.route("/api/notifications", notifications)
app.route("/api/backups", backups)
app.route("/api/logs", logs)
app.route("/api/events", events)
app.route("/api/system", system)

app.use(
  "/*",
  serveStatic({
    root: WEB_DIST,
  }),
)
app.get("/*", (c) => {
  return c.html(Bun.file(`${WEB_DIST}/index.html`).text())
})

const start = async (): Promise<void> => {
  Bun.serve({
    fetch: app.fetch,
    hostname: HOST,
    port: PORT,
  })
  console.log(`Chest-Backup API running on http://${HOST}:${String(PORT)}`)

  captureEngineLogs()

  addLogEntry({
    id: `log-start-${String(Date.now())}`,
    timestamp: new Date().toISOString(),
    level: LogLevel.Info,
    message: "Chest-Backup API started",
    metadata: {},
  })

  loadConfigForApi()
  await loadAndStartDaemon()
}

process.on("exit", () => {
  flushLogs()
})

await start()
