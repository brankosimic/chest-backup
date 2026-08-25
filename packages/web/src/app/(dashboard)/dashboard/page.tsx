"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { BackupProgressCard } from "@/components/ui/backup-progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatSize, formatDuration, formatUptime, formatDate, cn } from "@/lib/utils"
import { useBackupStats, useTriggerBackup, useBackups, useSystem, useDestinations, useBackupProgress, useDestinationUsage } from "@/hooks/use-queries"
import { CheckCircle2, Clock, Play, AlertTriangle } from "lucide-react"
import type { DestCardProps } from "@/types/backup"

const DestCard = ({ destination }: DestCardProps) => {
  const { t } = useTranslation()
  const { data: usage, isLoading } = useDestinationUsage(destination.id)
  return (
    <Card className={cn(
      "relative",
      !isLoading && usage ? (usage.available ? "border-green-500" : "border-destructive") : "",
    )}>
      {!isLoading && usage && !usage.available && (
        <AlertTriangle className="absolute right-2 top-2 h-4 w-4 text-destructive" aria-label={t("destinations.unavailable")} />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={destination.path}>
          {destination.name ?? destination.path}
        </CardTitle>
        <Badge variant={destination.type === "local" ? "default" : "secondary"} className="shrink-0">
          {destination.type === "local" ? t("destinations.local") : t("destinations.sftp")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <LoadingSpinner size="sm" className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-lg font-bold">{usage?.fileCount ?? 0}</div>
                <p className="text-xs text-muted-foreground">{t("dashboard.fileCount")}</p>
              </div>
              <div>
                <div className="text-lg font-bold">{formatSize(usage?.totalSize ?? 0)}</div>
                <p className="text-xs text-muted-foreground">{t("dashboard.size")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{t("dashboard.avgDuration")}: </span>
              <span className="font-medium text-foreground">
                {usage ? formatDuration(usage.avgDurationMs) : "-"}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const recentBackups = backupsData?.data ?? []
  const successRate = stats && stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0

  return (
    <div className="mx-auto max-w-7xl">
      <Header title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destinations?.map((dest) => (
          <DestCard key={dest.id} destination={dest} />
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.successRate")}</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.avgDuration")}</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatDuration(stats.avgDuration) : "-"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentBackups")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBackups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{formatDate(backup.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">
                      {backup.archiveSize ? formatSize(backup.archiveSize) : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={backup.success ? "success" : "destructive"}>
                      {backup.success ? t("status.success") : t("status.failed")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {backup.durationMs > 0 ? formatDuration(backup.durationMs) : "-"}
                    </span>
                  </div>
                </div>
              ))}
              {!recentBackups.length && (
                <p className="text-center text-sm text-muted-foreground">{t("common.noResults")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.systemHealth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("dashboard.status")}</span>
                <Badge variant={system?.status === "running" ? "success" : "destructive"}>
                  {system?.status ?? "unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("dashboard.uptime")}</span>
                <span className="text-sm">{formatUptime(system?.uptime ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("dashboard.version")}</span>
                <span className="text-sm">{system?.version ?? "-"}</span>
              </div>
              {system && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.cpuUsage")}</span>
                      <span className="text-sm">{String(system.cpuUsage)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${String(system.cpuUsage)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.memoryUsage")}</span>
                      <span className="text-sm">
                        {formatSize(system.memoryUsage.used)} / {formatSize(system.memoryUsage.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{
                          width: `${String(system.memoryUsage.total > 0 ? (system.memoryUsage.used / system.memoryUsage.total) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.diskUsage")}</span>
                      <span className="text-sm">
                        {formatSize(system.diskUsage.used)} / {formatSize(system.diskUsage.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
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

      <div className="mt-6 space-y-4">
        <BackupProgressCard />

        <Button
          variant="default"
          size="lg"
          onClick={() => {
            triggerMutation.mutate()
          }}
          disabled={triggerMutation.isPending || isRunning}
        >
          <Play className="mr-2 h-4 w-4" />
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
