import { motion } from "framer-motion"
import type { FC } from "react"

interface StatusBadgeProps {
  status: "idle" | "running" | "success" | "error" | boolean | string
  pulse?: boolean
}

const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
  idle: { bg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", dot: "bg-gray-400", label: "Idle" },
  running: { bg: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Running" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Success" },
  error: { bg: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Error" },
  true: { bg: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Success" },
  false: { bg: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Failed" },
  skipped: { bg: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", dot: "bg-amber-500", label: "Skipped" },
}

const StatusBadge: FC<StatusBadgeProps> = ({ status, pulse }) => {
  const key = typeof status === "string" ? status.toLowerCase() : String(status)
  const config = statusConfig[key] ?? { bg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", dot: "bg-gray-400", label: String(status) }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? "animate-pulse" : ""}`} />
      {config.label}
    </motion.span>
  )
}

export default StatusBadge
