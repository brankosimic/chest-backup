import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { FileText, RefreshCw, AlertCircle } from "lucide-react"
import { useLogs } from "@/hooks/useApi"
import type { FC } from "react"

const Logs: FC = () => {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch, isRefetching } = useLogs()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-500">{t("common.error")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={() => void refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? t("logs.refreshing") : t("logs.refresh")}
        </button>
      </div>

      {/* Log content */}
      <div className="rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            ))}
          </div>
        ) : !data?.lines.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 text-gray-600" />
            <p className="text-sm text-gray-500">{t("logs.noLogs")}</p>
          </div>
        ) : (
          <div className="p-4 max-h-[600px] overflow-y-auto font-mono text-xs leading-relaxed">
            {data.lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.002, 0.5) }}
                className="py-0.5 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <span className="text-gray-600 mr-3 select-none">{String(i + 1).padStart(3, "0")}</span>
                {line}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Logs
