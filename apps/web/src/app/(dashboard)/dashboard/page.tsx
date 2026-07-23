"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { BackupProgressCard } from "@/components/ui/backup-progress"
import { formatSize, formatDuration, formatUptime, formatDate } from "@/lib/utils"
import { useBackupStats, useTriggerBackup, useBackups, useSystem } from "@/hooks/use-queries"
import { CheckCircle2, Clock, Play } from "lucide-react"

interface DestCardProps {
  name: string
  type: string
  fileCount: number
  totalSize: number
  avgDurationMs: number
  path: string
}

const DestCard = (props: DestCardProps) => {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={props.path}>{props.name}</CardTitle>
        <Badge variant={props.type === "local" ? "default" : "secondary"} className="shrink-0">{props.type === "local" ? t("destinations.local") : t("destinations.sftp")}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-lg font-bold">{props.fileCount}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.fileCount")}</p>
          </div>
          <div>
            <div className="text-lg font-bold">{formatSize(props.totalSize)}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.size")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{t("dashboard.avgDuration")}: </span>
          <span className="font-medium text-foreground">{props.avgDurationMs > 0 ? formatDuration(props.avgDurationMs) : "-"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading: statsLoading } = useBackupStats()
  const { data: system, isLoading: systemLoading } = useSystem()
  const { data: backupsData } = useBackups(1, 5)
  const triggerMutation = useTriggerBackup()

  const loading = statsLoading || systemLoading

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const recentBackups = backupsData?.data ?? []
  const destinationCards = stats?.destinations ?? []
  const successRate = stats && stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0

  return (
    <div className="mx-auto max-w-7xl">
      <Header title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destinationCards.map((dest, i) => (
          <DestCard
            key={i}
            name={dest.name ?? dest.path}
            type={dest.type}
            fileCount={dest.fileCount}
            totalSize={dest.totalSize}
            avgDurationMs={dest.avgDurationMs}
            path={dest.path}
          />
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
              {!recentBackups.length && <p className="text-center text-sm text-muted-foreground">{t("common.noResults")}</p>}
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
                <Badge variant={system?.status === "running" ? "success" : "destructive"}>{system?.status ?? "unknown"}</Badge>
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
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${String(system.cpuUsage)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.memoryUsage")}</span>
                      <span className="text-sm">{formatSize(system.memoryUsage.used)} / {formatSize(system.memoryUsage.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${String(system.memoryUsage.total > 0 ? (system.memoryUsage.used / system.memoryUsage.total) * 100 : 0)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.diskUsage")}</span>
                      <span className="text-sm">{formatSize(system.diskUsage.used)} / {formatSize(system.diskUsage.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${String(system.diskUsage.total > 0 ? (system.diskUsage.used / system.diskUsage.total) * 100 : 0)}%` }} />
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
          onClick={() => { triggerMutation.mutate(); }}
          disabled={triggerMutation.isPending}
        >
          <Play className="mr-2 h-4 w-4" />
          {triggerMutation.isPending ? t("common.loading") : t("dashboard.runBackup")}
        </Button>
      </div>
    </div>
  )
}
