import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TimeRange } from "@/types/activity"

const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

/** Locale used for date/number formatting — kept in sync with the active UI language. */
let currentLocale = "en"

const setLocale = (locale: string): void => {
  currentLocale = locale
}

const RANGE_DAYS: Partial<Record<TimeRange, number>> = {
  [TimeRange.Day]: 1,
  [TimeRange.Week]: 7,
  [TimeRange.Month]: 30,
  [TimeRange.Quarter]: 90,
}

/**
 * Start of the window a time range covers, or undefined for "all time".
 */
const rangeToFrom = (range: TimeRange): string | undefined => {
  const days = RANGE_DAYS[range]
  if (!days) return undefined
  const date = new Date(Date.now() - days * 86_400_000)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const formatSpeed = (bytesPerSec: number): string => {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
  const kb = bytesPerSec / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB/s`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB/s`
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return "-"
  if (ms < 1000) return `${String(Math.round(ms))}ms`
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${String(totalSec)}s`
  const m = Math.floor(totalSec / 60)
  const remainingS = totalSec % 60
  if (m < 60) return `${String(m)}m ${String(remainingS)}s`
  const h = Math.floor(m / 60)
  const remainingM = m % 60
  return `${String(h)}h ${String(remainingM)}m`
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  if (gb < 1024) return `${gb.toFixed(1)} GB`
  const tb = gb / 1024
  return `${tb.toFixed(2)} TB`
}

const formatNumber = (value: number): string => new Intl.NumberFormat(currentLocale).format(value)

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString(currentLocale)
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString(currentLocale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const formatDateOnly = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString(currentLocale, { year: "numeric", month: "short", day: "2-digit" })
}

/**
 * Compact absolute timestamp — omits the year for dates in the current year.
 */
const formatDateTimeCompact = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"

  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleString(currentLocale, {
    ...(sameYear ? {} : { year: "numeric" as const }),
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatClock = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"
  const pad = (value: number, size = 2): string => String(value).padStart(size, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

const formatRelative = (dateStr: string, now = Date.now()): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"

  const diffMs = date.getTime() - now
  const abs = Math.abs(diffMs)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1000],
  ]

  const formatter = new Intl.RelativeTimeFormat(currentLocale, { numeric: "auto" })

  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") {
      return formatter.format(Math.round(diffMs / ms), unit)
    }
  }

  return formatter.format(0, "second")
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${String(days)}d ${String(hours)}h ${String(minutes)}m`
  if (hours > 0) return `${String(hours)}h ${String(minutes)}m`
  return `${String(minutes)}m`
}

const formatPercent = (value: number): string => `${String(Math.round(value))}%`

export {
  cn,
  setLocale,
  rangeToFrom,
  formatDate,
  formatDateTime,
  formatDateTimeCompact,
  formatDateOnly,
  formatClock,
  formatRelative,
  formatDuration,
  formatSize,
  formatSpeed,
  formatNumber,
  formatPercent,
  formatUptime,
}
