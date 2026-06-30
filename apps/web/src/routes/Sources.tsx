import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { FolderOpen, Database, Container, Server, AlertCircle } from "lucide-react"
import { useConfig } from "@/hooks/useApi"
import type { FC } from "react"
import type { BackupSource } from "@chest-backup/shared"

const sourceIcons: Record<string, FC<{ className?: string }>> = {
  path: FolderOpen,
  postgres: Database,
  "postgres-container": Container,
  "docker-compose": Server,
}

const sourceColors: Record<string, string> = {
  path: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  postgres: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  "postgres-container": "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
  "docker-compose": "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
}

const SourceCard: FC<{ source: BackupSource; index: number }> = ({ source, index }) => {
  const Icon = sourceIcons[source.type] ?? FolderOpen

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sourceColors[source.type] ?? sourceColors.path}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {source.label}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {source.type === "path" && source.path}
          {source.type === "postgres" && `${source.database ?? "db"} @ database`}
          {source.type === "postgres-container" && `Container: ${source.containerName ?? "—"}`}
          {source.type === "docker-compose" && source.containers?.join(", ")}
        </p>

        <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${sourceColors[source.type] ?? sourceColors.path}`}>
          {source.type}
        </span>
      </div>
    </motion.div>
  )
}

const Sources: FC = () => {
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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!config?.sources.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Database className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("sources.noSources")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {config.sources.map((source, index) => (
        <SourceCard key={`${source.type}-${index.toString()}`} source={source} index={index} />
      ))}
    </div>
  )
}

export default Sources
