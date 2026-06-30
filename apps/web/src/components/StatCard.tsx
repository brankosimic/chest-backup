import { motion } from "framer-motion"
import type { FC, ReactNode } from "react"

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: string
  subtitle?: string
  trend?: "up" | "down" | "neutral"
}

const colorMap: Record<string, string> = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  red: "from-red-500 to-red-600",
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, color = "indigo", subtitle, trend }) => {
  const gradient = colorMap[color] ?? colorMap.indigo

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}

          {trend && (
            <span className={`inline-flex items-center mt-1 text-xs font-medium ${
              trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-gray-400"
            }`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          )}
        </div>

        <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>

      {/* Decorative gradient dot */}
      <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-5 dark:opacity-10`} />
    </motion.div>
  )
}

export default StatCard
