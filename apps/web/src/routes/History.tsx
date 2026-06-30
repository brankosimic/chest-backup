import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Clock, HardDrive, AlertCircle } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import { useHistory } from "@/hooks/useApi"
import type { FC } from "react"
import type { BackupRecord } from "@chest-backup/shared"

const formatDuration = (ms: number): string => {
  if (!ms) return "—"

  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

const formatSize = (bytes?: number): string => {
  if (!bytes) return "—"

  const mb = bytes / 1024 / 1024
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`

  return `${mb.toFixed(1)} MB`
}

const HistoryRow: FC<{ record: BackupRecord; index: number }> = ({ record, index }) => (
  <motion.tr
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
  >
    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        {new Date(record.timestamp).toLocaleString()}
      </div>
    </td>

    <td className="py-3 px-4">
      <StatusBadge status={record.success} />
    </td>

    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
      {formatDuration(record.durationMs)}
    </td>

    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
      {record.archiveName ?? "—"}
    </td>

    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
      {formatSize(record.archiveSize)}
    </td>

    <td className="py-3 px-4">
      {record.errors.length > 0 ? (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="truncate max-w-[150px]">{record.errors[0]}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </td>

    <td className="py-3 px-4">
      <div className="flex items-center gap-1">
        <HardDrive className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">
          {record.destinationResults.filter((d) => d.success).length}/{record.destinationResults.length}
        </span>
      </div>
    </td>
  </motion.tr>
)

const History: FC = () => {
  const { t } = useTranslation()
  const { data: history, isLoading, error } = useHistory()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-500">{t("common.error")}</p>
        <p className="text-xs text-gray-400">{(error as Error).message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!history?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("history.noHistory")}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.timestamp")}
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.status")}
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.duration")}
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.archive")}
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.size")}
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.errors")}
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("history.table.destinations")}
              </th>
            </tr>
          </thead>

          <tbody>
            {history.map((record, index) => (
              <HistoryRow key={record.id} record={record} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default History
