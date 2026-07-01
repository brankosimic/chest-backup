import { Hono } from "hono"
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

import { loadAndStartDaemon } from "./lib/api-config"
import { seedLogsFromHistory } from "./lib/store"

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

app.get("/", (c) => c.json({ success: true, message: "Chest-Backup API" }))

const start = async (): Promise<void> => {
  Bun.serve({
    fetch: app.fetch,
    port: PORT,
  })
  console.log(`Chest-Backup API running on http://localhost:${PORT}`)
  await loadAndStartDaemon()
  seedLogsFromHistory()
}

await start()
