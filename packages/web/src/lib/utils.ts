import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

const formatSpeed = (bytesPerSec: number): string => {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
  const kb = bytesPerSec / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB/s`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB/s`
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${String(ms)}ms`
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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString(navigator.language, { timeZone: "UTC" })
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${String(days)}d ${String(hours)}h ${String(minutes)}m`
  if (hours > 0) return `${String(hours)}h ${String(minutes)}m`
  return `${String(minutes)}m`
}

export { cn, formatDate, formatDuration, formatSize, formatSpeed, formatUptime }
