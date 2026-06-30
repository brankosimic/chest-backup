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

// ── Daemon (scheduler + tray) ──────────────────────────────────────────────
import { loadConfig } from "../../../src/config/loader"
import { startDaemon } from "../../../src/daemon"
import { logger } from "../../../src/utils/logger"

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

// ── Start server and daemon ────────────────────────────────────────────────
const configPath = process.env.CHEST_CONFIG_PATH

const start = async (): Promise<void> => {
  // Start API server
  Bun.serve({
    fetch: app.fetch,
    port: PORT,
  })
  console.log(`Chest-Backup API running on http://localhost:${PORT}`)

  // Start daemon (scheduler + tray)
  if (configPath) {
    try {
      const config = loadConfig(configPath)
      await startDaemon(config)
      console.log("Chest-Backup daemon started")
    } catch (err) {
      logger.fatal({ err }, "failed to start daemon")
      process.exit(1)
    }
  } else {
    console.log("Chest-Backup daemon skipped (no CHEST_CONFIG_PATH)")
  }
}

await start()
