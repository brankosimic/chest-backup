import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { HardDrive, Globe, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useConfig } from "@/hooks/useApi"
import type { FC } from "react"
import type { BackupDestination } from "@chest-backup/shared"

const DestCard: FC<{ dest: BackupDestination; index: number }> = ({ dest, index }) => {
  const { t } = useTranslation()
  const isSFTP = dest.type === "sftp"
  const Icon = isSFTP ? Globe : HardDrive
  const isActive = !dest.skip

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isSFTP
            ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
            : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        }`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {dest.type}
            </p>

            {isActive ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {t("destinations.active")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" />
                {t("destinations.skipped")}
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t("destinations.path")}:</span>{" "}
              {dest.path}
            </p>

            {dest.host && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{t("destinations.host")}:</span>{" "}
                {dest.host}{dest.port ? `:${dest.port}` : ""}
              </p>
            )}

            {dest.retention && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{t("destinations.retention")}:</span>{" "}
                {dest.retention}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const Destinations: FC = () => {
  const { t } = useTranslation()
  const { data: config, isLoading, error } = useConfig()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-500">{t("common.error")}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!config?.destinations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <HardDrive className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("destinations.noDestinations")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {config.destinations.map((dest, index) => (
        <DestCard key={`${dest.type}-${index.toString()}`} dest={dest} index={index} />
      ))}
    </div>
  )
}

export default Destinations
