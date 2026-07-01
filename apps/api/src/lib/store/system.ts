import { totalmem, freemem, uptime as osUptime, cpus } from "node:os"
import { execSync } from "node:child_process"
import type { SystemInfo } from "@chest-backup/shared"

const getSystem = (): SystemInfo => {
  const cpusList = cpus()
  const load = execSync("cat /proc/loadavg 2>/dev/null || echo '0 0 0'", { encoding: "utf-8" }).trim()
  const loadParts = load.split(" ").map(Number)
  const cpuCount = cpusList.length
  const cpuPercent = cpuCount > 0 ? Math.min(100, Math.round(((loadParts[0] ?? 0) / cpuCount) * 100)) : 0

  const totalMem = totalmem()
  const freeMem = freemem()
  const memPercent = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0

  let diskPercent = 0
  try {
    const df = execSync("df / 2>/dev/null | tail -1", { encoding: "utf-8" }).trim().split(/\s+/)
    diskPercent = parseInt(df[4] ?? "0", 10) || 0
  } catch {
    console.warn("failed to read disk stats")
  }

  return {
    version: "1.0.0",
    uptime: Math.floor(osUptime()),
    status: "running",
    cpuUsage: cpuPercent,
    memoryUsage: memPercent,
    diskUsage: diskPercent,
  }
}

export { getSystem }
