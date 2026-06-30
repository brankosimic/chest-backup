import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const cn = (...classes: (string | undefined | null | boolean)[]): string => twMerge(clsx(classes))

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, index)

  return `${value.toFixed(index > 0 ? 1 : 0)} ${units[index]}`
}

const formatTimestamp = (ts: string): string => {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export { cn, formatDuration, formatBytes, formatTimestamp }
