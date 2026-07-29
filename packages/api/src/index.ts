import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { resolve } from "node:path"
import { cors } from "./middleware/cors"
import { errorHandling } from "./middleware/error"
import { port as PORT } from "./env"
import { backups } from "./routes/backups"
import { destinations } from "./routes/destinations"
import { logs } from "./routes/logs"
import { notifications } from "./routes/notifications"
import { retention } from "./routes/retention"
import { schedule } from "./routes/schedule"
import { sources } from "./routes/sources"
import { system } from "./routes/system"

import { loadConfigForApi, loadAndStartDaemon } from "./lib/api-config"
import { seedLogsFromHistory, pushLog } from "./lib/store"

const WEB_DIST = process.env.WEB_DIST_PATH ?? resolve(import.meta.dirname, "../../web/dist")

const app = new Hono()

app.use("*", cors)
app.use("*", errorHandling)

app.route("/api/sources", sources)
app.route("/api/destinations", destinations)
app.route("/api/schedule", schedule)
app.route("/api/retention", retention)
app.route("/api/notifications", notifications)
app.route("/api/backups", backups)
app.route("/api/logs", logs)
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
    port: PORT,
  })
  console.log(`Chest-Backup API running on http://localhost:${String(PORT)}`)
  seedLogsFromHistory()
  pushLog({
    id: `log-start-${String(Date.now())}`,
    timestamp: new Date().toISOString(),
    level: "info",
    message: "Chest-Backup API started",
    metadata: {},
  })
  loadConfigForApi()
  if (process.env.DAEMON_OWNER !== "tray") await loadAndStartDaemon()
}

await start()
