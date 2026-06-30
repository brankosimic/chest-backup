import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Sun, Moon, Bell, CalendarClock, Layers, Server, AlertCircle } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import { useTheme } from "@/hooks/useTheme"
import { useConfig } from "@/hooks/useApi"
import type { FC } from "react"

const Settings: FC = () => {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const { data: config, isLoading, error } = useConfig()

  return (
    <div className="max-w-2xl space-y-4">
      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              {theme === "dark" ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("settings.theme")}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {theme === "dark" ? t("settings.dark") : t("settings.light")}
              </p>
            </div>
          </div>

          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      </motion.div>

      {/* Schedule & Retention */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{t("common.error")}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("settings.schedule")}</p>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {config?.schedule ?? t("common.never")}
            </p>

            {config?.schedule && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cron expression
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("settings.retention")}</p>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300">
              {config?.retention ?? "—"} {t("common.minutes")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("settings.notifications")}</p>
            </div>

            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              config?.hasDiscordNotifications
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}>
              {config?.hasDiscordNotifications ? t("settings.notificationsEnabled") : t("settings.notificationsDisabled")}
            </span>
          </motion.div>

          {/* API Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                <Server className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("settings.apiInfo")}</p>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {t("settings.apiEndpoint")}: /api
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t("settings.version")}: 1.0.0
            </p>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default Settings
