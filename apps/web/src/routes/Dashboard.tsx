import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Play, Database, CheckCircle2, XCircle, Clock, Activity, CalendarClock, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import { useStats, useStatus, useTriggerBackup } from "@/hooks/useApi"
import type { FC } from "react"

const formatDuration = (ms: number): string => {
  if (!ms) return "—"

  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

const formatUptime = (seconds: number): string => {
  if (!seconds) return "—"

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  parts.push(`${mins}m`)

  return parts.join(" ")
}

const Dashboard: FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: status, isLoading: statusLoading } = useStatus()
  const triggerMutation = useTriggerBackup()

  const isLoading = statsLoading || statusLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const successRate = stats?.totalBackups
    ? Math.round((stats.successfulBackups / stats.totalBackups) * 100)
    : 0

  const handleTriggerBackup = () => {
    if (!triggerMutation.isPending) {
      void triggerMutation.mutateAsync()
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("dashboard.totalBackups")}
          value={stats?.totalBackups ?? 0}
          icon={<Database className="w-5 h-5" />}
          color="indigo"
        />

        <StatCard
          title={t("dashboard.successful")}
          value={stats?.successfulBackups ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />

        <StatCard
          title={t("dashboard.failed")}
          value={stats?.failedBackups ?? 0}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />

        <StatCard
          title={t("dashboard.successRate")}
          value={`${successRate}%`}
          icon={<Activity className="w-5 h-5" />}
          color="purple"
          subtitle={stats?.totalBackups ? `${stats.successfulBackups}/${stats.totalBackups}` : t("common.noData")}
        />
      </div>

      {/* Status & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t("dashboard.status")}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("common.status")}</p>
              <StatusBadge status={status?.state ?? "idle"} pulse={status?.state === "running"} />
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("dashboard.uptime")}</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formatUptime(status?.uptime ?? 0)}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("dashboard.nextSchedule")}</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                {status?.schedule || t("common.never")}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("dashboard.lastBackup")}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {stats?.lastBackup ? new Date(stats.lastBackup.timestamp).toLocaleString() : t("common.never")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t("dashboard.quickActions")}</h3>

          <div className="space-y-3">
            <button
              onClick={handleTriggerBackup}
              disabled={triggerMutation.isPending || status?.state === "running"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className={`w-4 h-4 ${triggerMutation.isPending ? "animate-pulse" : ""}`} />
              {triggerMutation.isPending ? t("dashboard.triggering") : t("dashboard.backupNow")}
            </button>

            <button
              onClick={() => navigate("/history")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              {t("dashboard.viewHistory")}
            </button>
          </div>

          {triggerMutation.data && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 text-xs ${triggerMutation.data.success ? "text-emerald-500" : "text-red-500"}`}
            >
              {triggerMutation.data.message}
            </motion.p>
          )}

          {triggerMutation.isError && (
            <p className="mt-3 text-xs text-red-500">
              {triggerMutation.error?.message ?? t("common.error")}
            </p>
          )}
        </motion.div>
      </div>

      {/* Last Backup Details */}
      {stats?.lastBackup && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t("dashboard.lastBackup")}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("common.status")}</p>
              <StatusBadge status={stats.lastBackup.success} />
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("history.table.duration")}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDuration(stats.lastBackup.durationMs)}</p>
            </div>

            {stats.lastBackup.archiveName && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("history.table.archive")}</p>
                <p className="font-medium text-gray-900 dark:text-white truncate">{stats.lastBackup.archiveName}</p>
              </div>
            )}

            {stats.lastBackup.archiveSize && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("history.table.size")}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {(stats.lastBackup.archiveSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Dashboard
