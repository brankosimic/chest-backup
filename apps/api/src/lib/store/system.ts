import type { CpuTimes } from "../../types/api"
import { readFileSync } from "node:fs"
import { totalmem, freemem, uptime as osUptime } from "node:os"
import { execSync } from "node:child_process"
import type { SystemInfo } from "@chest-backup/shared"
import pkg from "../../../package.json" with { type: "json" }

let prevCpuTimes: CpuTimes | null = null

const parseCpuLine = (line: string): CpuTimes | null => {
  const parts = line.trim().split(/\s+/).slice(1).map(Number)

  if (parts.length < 8) return null

  const total = parts[0] + parts[1] + parts[2] + parts[3] + parts[4] + parts[5] + parts[6] + parts[7]
  const idle = parts[3]

  return { total, idle }
}

const readCpuStat = (): CpuTimes | null => {
  const stat = readFileSync("/proc/stat", "utf-8")
  const firstLine = stat.split("\n").find(l => l.startsWith("cpu "))

  return firstLine ? parseCpuLine(firstLine) : null
}

const getCpuUsage = (): number => {
  try {
    const current = readCpuStat()

    if (!current || !prevCpuTimes) {
      prevCpuTimes = current
      return 0
    }

    const totalDelta = current.total - prevCpuTimes.total
    const idleDelta = current.idle - prevCpuTimes.idle
    prevCpuTimes = current

    if (totalDelta <= 0) return 0

    return Math.min(100, Math.round(((totalDelta - idleDelta) / totalDelta) * 100))
  } catch {
    console.warn("failed to read /proc/stat")
    return 0
  }
}

const getSystem = (): SystemInfo => {
  const cpuPercent = getCpuUsage()
  const totalMem = totalmem()
  const freeMem = freemem()

  let diskUsed = 0
  let diskTotal = 0

  try {
    const df = execSync("df / 2>/dev/null | tail -1", { encoding: "utf-8" }).trim().split(/\s+/)
    diskTotal = (parseInt(df[1] ?? "0", 10) || 0) * 1024
    diskUsed = (parseInt(df[2] ?? "0", 10) || 0) * 1024
  } catch {
    console.warn("failed to read disk stats")
  }

  return {
    version: pkg.version,
    uptime: Math.floor(osUptime()),
    status: "running",
    cpuUsage: cpuPercent,
    memoryUsage: { used: totalMem - freeMem, total: totalMem },
    diskUsage: { used: diskUsed, total: diskTotal },
  }
}

export { getSystem }
