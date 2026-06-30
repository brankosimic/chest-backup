import { fileURLToPath } from "node:url"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join, dirname, extname } from "node:path"
import { spawn } from "node:child_process"
import { Hono } from "hono"
import { cors } from "hono/cors"
import type { DaemonStatus, ConfigView, BackupRecord, DashboardStats, BackupSource, BackupDestination } from "@chest-backup/shared"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = Number(process.env["PORT"] ?? 3001)
const CONFIG_PATH = join(__dirname, "..", "..", "..", "chest-backup.json")
const DATA_DIR = join(__dirname, "..", "..", "..", "data")
const HISTORY_PATH = join(DATA_DIR, "history.json")
const FRONTEND_DIST = join(__dirname, "..", "..", "web", "dist")

const app = new Hono()

app.use("/api/*", cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }))

const daemonState = {
  startTime: Date.now(),
  running: false,
  state: "idle" as DaemonStatus["state"],
  message: "Daemon is idle",
}

const readJsonFile = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    const content = await readFile(path, "utf-8")
    return JSON.parse(content) as T
  } catch {
    return fallback
  }
}

const readConfigRaw = async (): Promise<Record<string, unknown>> => {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8")
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return {}
  }
}

const sanitizeSource = (s: Record<string, unknown>): BackupSource => {
  const type = String(s["type"] ?? "path") as BackupSource["type"]

  if (type === "path") return { type, label: String(s["path"] ?? ""), path: String(s["path"] ?? "") }

  if (type === "postgres") return { type, label: `${String(s["database"] ?? "db")}@${String(s["host"] ?? "")}`, database: String(s["database"] ?? ""), containerName: undefined, path: undefined }

  if (type === "postgres-container") return { type, label: s["containerName"] as string ?? "", containerName: s["containerName"] as string ?? "", database: s["database"] as string ?? "" }

  return { type, label: s["name"] as string ?? "", name: s["name"] as string ?? "", containers: s["containers"] as string[] ?? [], path: s["path"] as string ?? "" }
}

const sanitizeDestination = (d: Record<string, unknown>): BackupDestination => {
  const type = String(d["type"] ?? "local") as BackupDestination["type"]

  return {
    type,
    path: String(d["path"] ?? ""),
    host: d["host"] as string | undefined,
    port: d["port"] as number | undefined,
    user: d["user"] as string | undefined,
    retention: d["retention"] as number | undefined,
    parallel: d["parallel"] as boolean | undefined,
    skip: d["skip"] as boolean | undefined,
  }
}

app.get("/api/status", async (c) => {
  const history = await readJsonFile<BackupRecord[]>(HISTORY_PATH, [])
  const lastBackup = history[0] ?? null
  const rawConfig = await readConfigRaw()
  const schedule = rawConfig["schedule"] as string | undefined

  const status: DaemonStatus = {
    running: daemonState.running,
    state: daemonState.state,
    message: daemonState.message,
    lastBackup,
    schedule: schedule ?? "",
    uptime: Math.floor((Date.now() - daemonState.startTime) / 1000),
  }

  return c.json(status)
})

app.get("/api/config", async (c) => {
  const raw = await readConfigRaw()

  const sources = (raw["sources"] as Record<string, unknown>[] ?? []).map(sanitizeSource)
  const destinations = (raw["destinations"] as Record<string, unknown>[] ?? []).map(sanitizeDestination)
  const notifications = raw["notifications"] as Record<string, unknown> | undefined

  const config: ConfigView = {
    schedule: raw["schedule"] as string | undefined,
    retention: raw["retention"] as number ?? 0,
    sources,
    destinations,
    hasDiscordNotifications: !!(notifications && notifications["discord"]),
  }

  return c.json(config)
})

app.get("/api/history", async (c) => {
  const history = await readJsonFile<BackupRecord[]>(HISTORY_PATH, [])
  return c.json(history)
})

app.get("/api/stats", async (c) => {
  const history = await readJsonFile<BackupRecord[]>(HISTORY_PATH, [])
  const totalBackups = history.length
  const successfulBackups = history.filter((r) => r.success).length
  const failedBackups = totalBackups - successfulBackups
  const lastBackup = history[0] ?? null
  const rawConfig = await readConfigRaw()
  const schedule = rawConfig["schedule"] as string | undefined

  const stats: DashboardStats = {
    totalBackups,
    successfulBackups,
    failedBackups,
    lastBackup,
    nextScheduled: schedule ?? null,
    uptime: Math.floor((Date.now() - daemonState.startTime) / 1000),
  }

  return c.json(stats)
})

app.post("/api/backup/trigger", async (c) => {
  if (daemonState.running) {
    return c.json({ success: false, message: "Backup already in progress" }, 409)
  }

  daemonState.running = true
  daemonState.state = "running"
  daemonState.message = "Backup in progress"

  const triggerScript = join(import.meta.dirname, "..", "..", "..", "src", "index.ts")

  try {
    const result = await new Promise<{ success: boolean; output: string }>((resolve, reject) => {
      const child = spawn("bun", [triggerScript, "--", "--run-now"], {
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 600000,
      })

      let output = ""
      let errorOutput = ""

      child.stdout?.on("data", (data: Buffer) => { output += data.toString() })
      child.stderr?.on("data", (data: Buffer) => { errorOutput += data.toString() })

      child.on("close", (code: number | null) => {
        const combined = output + errorOutput
        if (code === 0) {
          resolve({ success: true, output: combined })
        } else {
          resolve({ success: false, output: combined || `Process exited with code ${String(code)}` })
        }
      })

      child.on("error", (err: Error) => { reject(err) })
    })

    daemonState.running = false
    daemonState.state = result.success ? "success" : "error"
    daemonState.message = result.success ? "Backup completed successfully" : `Backup failed: ${result.output.slice(0, 200)}`

    const record: BackupRecord = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      success: result.success,
      durationMs: 0,
      destinationResults: [],
      errors: result.success ? [] : [result.output.slice(0, 500)],
    }

    const history = await readJsonFile<BackupRecord[]>(HISTORY_PATH, [])
    history.unshift(record)
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2))

    return c.json({ success: result.success, message: daemonState.message })
  } catch (err) {
    daemonState.running = false
    daemonState.state = "error"
    daemonState.message = `Backup trigger failed: ${String(err)}`

    return c.json({ success: false, message: String(err) }, 500)
  }
})

app.get("/api/logs", async (c) => {
  try {
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn("journalctl", ["--user", "-u", "chest-backup", "-n", "100", "--no-pager", "--output", "short-iso"], {
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 10000,
      })

      let output = ""
      child.stdout?.on("data", (data: Buffer) => { output += data.toString() })
      child.stderr?.on("data", (_data: Buffer) => { /* ignore stderr */ })
      child.on("close", () => { resolve(output) })
      child.on("error", (err: Error) => { reject(err) })
    })

    const lines = result.split("\n").filter(Boolean)
    return c.json({ lines })
  } catch {
    return c.json({ lines: ["Logs unavailable - journalctl may not be available"] })
  }
})

app.get("/*", async (c) => {
  const url = new URL(c.req.url)
  let filePath = join(FRONTEND_DIST, url.pathname === "/" ? "index.html" : url.pathname)

  try {
    const content = await readFile(filePath)
    const ext = extname(filePath)
    const mime: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff2": "font/woff2",
    }
    return c.newResponse(content, 200, { "Content-Type": mime[ext] ?? "application/octet-stream" })
  } catch {
    // Fallback to index.html for SPA routing
    try {
      const content = await readFile(join(FRONTEND_DIST, "index.html"))
      return c.newResponse(content, 200, { "Content-Type": "text/html" })
    } catch {
      return c.json({ error: "Frontend not built. Run 'pnpm build:web' first." }, 503)
    }
  }
})

console.log(`API server listening on port ${PORT}`)

export default { port: PORT, fetch: app.fetch }
