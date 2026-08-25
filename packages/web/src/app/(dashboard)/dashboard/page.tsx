"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { BackupProgressCard } from "@/components/ui/backup-progress"
import { DestCard } from "@/components/dashboard/dest-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { formatSize, formatDuration, formatUptime, formatDate, cn } from "@/lib/utils"
import { useBackupStats, useTriggerBackup, useBackups, useSystem, useDestinations, useBackupProgress } from "@/hooks/use-queries"
import { CheckCircle2, Clock, Play } from "lucide-react"
import * as styles from "./page.styles"

const DashboardPage = () => {
  const { t } = useTranslation()
  const { data: stats, isLoading: statsLoading } = useBackupStats()
  const { data: system, isLoading: systemLoading } = useSystem()
  const { data: backupsData } = useBackups(1, 5)
  const { data: destinations } = useDestinations()
  const { data: progress } = useBackupProgress()
  const triggerMutation = useTriggerBackup(destinations ?? [])
  const isRunning = progress && ["archiving", "running"].includes(progress.status)

  const loading = statsLoading || systemLoading

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner} />
      </div>
    )
  }

  const recentBackups = backupsData?.data ?? []
  const successRate = stats?.total ? String(Math.round((stats.success / stats.total) * 100)) : "0"

  return (
    <div className={styles.page}>
      <Header title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className={styles.statsGrid}>
        {destinations?.map((dest) => (
          <DestCard key={dest.id} props={{ destination: dest }} />
        ))}
        <StatCard props={{ title: t("dashboard.successRate"), icon: <CheckCircle2 className={cn("h-5 w-5 text-green-500")} />, value: successRate + "%" }} />
        <StatCard props={{ title: t("dashboard.avgDuration"), icon: <Clock className={cn("h-5 w-5 text-amber-500")} />, value: stats ? formatDuration(stats.avgDuration) : "-" }} />
      </div>

      <div className={styles.cardsGrid}>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentBackups")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.list}>
              {recentBackups.map((backup) => (
                <div key={backup.id} className={styles.backupRow}>
                  <div className={styles.backupInfo}>
                    <p className={styles.backupTitle}>{formatDate(backup.timestamp)}</p>
                    <p className={styles.mutedText}>
                      {backup.archiveSize ? formatSize(backup.archiveSize) : "-"}
                    </p>
                  </div>
                  <div className={styles.backupMeta}>
                    <Badge variant={backup.success ? "success" : "destructive"}>
                      {backup.success ? t("status.success") : t("status.failed")}
                    </Badge>
                    <span className={styles.mutedText}>
                      {backup.durationMs > 0 ? formatDuration(backup.durationMs) : "-"}
                    </span>
                  </div>
                </div>
              ))}
              {!recentBackups.length && (
                <p className={styles.emptyText}>{t("common.noResults")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.systemHealth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.list}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t("dashboard.status")}</span>
                <Badge variant={system?.status === "running" ? "success" : "destructive"}>
                  {system?.status ?? t("common.unknown")}
                </Badge>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t("dashboard.uptime")}</span>
                <span className={styles.rowValue}>{formatUptime(system?.uptime ?? 0)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t("dashboard.version")}</span>
                <span className={styles.rowValue}>{system?.version ?? "-"}</span>
              </div>
              {system && (
                <>
                  <div className={styles.barGroup}>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>{t("dashboard.cpuUsage")}</span>
                      <span className={styles.rowValue}>{String(system.cpuUsage)}%</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.cpuBar} style={{ width: `${String(system.cpuUsage)}%` }} />
                    </div>
                  </div>
                  <div className={styles.barGroup}>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>{t("dashboard.memoryUsage")}</span>
                      <span className={styles.rowValue}>
                        {formatSize(system.memoryUsage.used)} / {formatSize(system.memoryUsage.total)}
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.memoryBar}
                        style={{
                          width: `${String(system.memoryUsage.total > 0 ? (system.memoryUsage.used / system.memoryUsage.total) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.barGroup}>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>{t("dashboard.diskUsage")}</span>
                      <span className={styles.rowValue}>
                        {formatSize(system.diskUsage.used)} / {formatSize(system.diskUsage.total)}
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.diskBar}
                        style={{
                          width: `${String(system.diskUsage.total > 0 ? (system.diskUsage.used / system.diskUsage.total) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.footer}>
        <BackupProgressCard />

        <Button
          variant="default"
          size="lg"
          onClick={() => { triggerMutation.mutate(); }}
          disabled={triggerMutation.isPending || isRunning}
        >
          <Play className={styles.playIcon} />
          {triggerMutation.isPending
            ? t("common.loading")
            : isRunning
              ? t("dashboard.backupInProgress")
              : t("dashboard.runBackup")}
        </Button>
      </div>
    </div>
  )
}

export { DashboardPage as default }
