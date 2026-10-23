"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { BackupProgressCard } from "@/components/ui/backup-progress"
import { DestCard } from "@/components/dashboard/dest-card"
import { StatTile } from "@/components/dashboard/stat-tile"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { HealthStrip } from "@/components/dashboard/health-strip"
import { formatSize, formatDuration, formatUptime, formatRelative, formatNumber } from "@/lib/utils"
import { useBackupStats, useTriggerBackup, useBackups, useSystem, useDestinations, useBackupProgress, useSchedule } from "@/hooks/use-queries"
import { StatTileTone } from "@/types/backup"
import { isActiveRunPhase } from "@/lib/run-phase"
import { CheckCircle2, Clock, Play, Activity, CalendarClock, HardDrive } from "lucide-react"
import * as styles from "./page.styles"

const DashboardPage = () => {
  const { t } = useTranslation()
  const { data: stats, isLoading: statsLoading } = useBackupStats()
  const { data: system, isLoading: systemLoading } = useSystem()
  const { data: backupsData, isLoading: backupsLoading } = useBackups({ limit: 20 })
  const { data: destinations } = useDestinations()
  const { data: progress } = useBackupProgress()
  const { data: schedule } = useSchedule()
  const triggerMutation = useTriggerBackup(destinations ?? [])
  const isRunning = !!progress && isActiveRunPhase(progress.phase)

  const loading = statsLoading || systemLoading

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner} />
      </div>
    )
  }

  const recentBackups = backupsData?.data ?? []
  const successRate = stats?.total ? Math.round((stats.success / stats.total) * 100) : 0

  return (
    <div className={styles.page}>
      <Header
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        action={
          <Button
            variant="default"
            onClick={() => {
              triggerMutation.mutate()
            }}
            disabled={triggerMutation.isPending || isRunning}
          >
            <Play className={styles.playIcon} />
            {triggerMutation.isPending
              ? t("common.loading")
              : isRunning
                ? t("dashboard.backupInProgress")
                : t("dashboard.runBackup")}
          </Button>
        }
      />

      <div className={styles.statsGrid}>
        <StatTile
          title={t("dashboard.totalBackups")}
          value={formatNumber(stats?.total ?? 0)}
          icon={<Activity className="h-3.5 w-3.5" />}
          hint={
            schedule?.lastRun ? t("dashboard.lastRun") + ": " + formatRelative(schedule.lastRun) : undefined
          }
        />
        <StatTile
          title={t("dashboard.successRate")}
          value={`${String(successRate)}%`}
          tone={successRate >= 90 ? StatTileTone.Success : successRate >= 60 ? StatTileTone.Warning : StatTileTone.Destructive}
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          hint={`${formatNumber(stats?.success ?? 0)} / ${formatNumber(stats?.total ?? 0)}`}
        />
        <StatTile
          title={t("dashboard.avgDuration")}
          value={stats ? formatDuration(stats.avgDuration) : "-"}
          icon={<Clock className="h-3.5 w-3.5" />}
          hint={`${formatNumber(stats?.filesChanged ?? 0)} ${t("dashboard.filesChanged").toLowerCase()}`}
        />
        <StatTile
          title={t("dashboard.transferred")}
          value={formatSize(stats?.totalUploadedBytes ?? 0)}
          icon={<HardDrive className="h-3.5 w-3.5" />}
          hint={
            schedule?.nextRun
              ? t("dashboard.nextRun") + ": " + formatRelative(schedule.nextRun)
              : schedule?.schedule
                ? schedule.schedule
                : undefined
          }
        />
      </div>

      {destinations && destinations.length > 0 && (
        <div className={styles.destGrid}>
          {destinations.map((dest) => (
            <DestCard key={dest.id} props={{ destination: dest }} />
          ))}
        </div>
      )}

      <div className={styles.cardsGrid}>
        <RecentActivity runs={recentBackups} loading={backupsLoading} />

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">{t("dashboard.systemHealth")}</CardTitle>
            <HealthStrip runs={recentBackups} />
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
              {schedule?.schedule && (
                <div className={styles.row}>
                  <span className={styles.rowLabel}>{t("schedule.title")}</span>
                  <span className={styles.rowValue}>
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      {schedule.schedule}
                    </span>
                  </span>
                </div>
              )}
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
      </div>
    </div>
  )
}

export { DashboardPage as default }
