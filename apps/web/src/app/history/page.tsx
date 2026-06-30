"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  HistoryIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ClockIcon,
  HardDriveIcon,
} from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatDuration, formatBytes, formatTimestamp } from "@/lib/utils"
import { getBackupHistory } from "@/lib/api"
import type { BackupResult } from "@/types"

const History = () => {
  const { t } = useTranslation()
  const [history, setHistory] = useState<BackupResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const result = await getBackupHistory()

      if (result.data) setHistory(result.data)
      setLoading(false)
    }

    void load()
  }, [])

  const successCount = history.filter((b) => b.success).length
  const failedCount = history.filter((b) => !b.success).length

  return (
    <Layout title={t("history.title")}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <HistoryIcon className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-semibold text-white">{t("history.title")}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2Icon className="h-4 w-4" />
                  {successCount}
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <AlertTriangleIcon className="h-4 w-4" />
                  {failedCount}
                </span>
              </div>
            </div>

            {history.length === 0 ? (
              <EmptyState
                icon={HistoryIcon}
                title={t("history.noHistory")}
              />
            ) : (
              <div className="space-y-3">
                {history.map((backup, index) => (
                  <motion.div
                    key={backup.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {backup.success ? (
                            <CheckCircle2Icon className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <AlertTriangleIcon className="h-5 w-5 text-rose-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {backup.archiveName ?? "Backup"}
                            </p>
                            <p className="text-xs text-slate-400">{formatTimestamp(backup.timestamp)}</p>
                          </div>
                        </div>
                        <Badge variant={backup.success ? "success" : "error"}>
                          {backup.success ? t("history.success") : t("history.failed")}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-6 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {formatDuration(backup.durationMs)}
                        </span>
                        {backup.archiveSize && (
                          <span className="flex items-center gap-1">
                            <HardDriveIcon className="h-4 w-4" />
                            {formatBytes(backup.archiveSize)}
                          </span>
                        )}
                        <span>{backup.destinationResults.length} {t("history.destinations")}</span>
                      </div>
                      {backup.errors.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <p className="text-xs text-rose-400">{backup.errors[0]}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default History
