import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${String(ms)}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${String(s)}s`
  const m = Math.floor(s / 60)
  const remainingS = s % 60
  return `${String(m)}m ${String(remainingS)}s`
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${String(days)}d ${String(hours)}h ${String(minutes)}m`
  if (hours > 0) return `${String(hours)}h ${String(minutes)}m`
  return `${String(minutes)}m`
}

export { cn, formatDate, formatDuration, formatSize, formatUptime }
