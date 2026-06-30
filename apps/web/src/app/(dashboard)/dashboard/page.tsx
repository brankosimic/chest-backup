"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { formatDuration, formatSize, formatUptime } from "@/lib/utils"
import { useBackupStats, useTriggerBackup, useBackups, useSystem } from "@/hooks/use-queries"
import {
  Database,
  CheckCircle2,
  Clock,
  HardDrive,
  Play,
} from "lucide-react"

const StatCard = ({ title, value, icon, variant = "default" }: { title: string; value: string; icon: React.ReactNode; variant?: string }) => {
  const variantClasses: Record<string, string> = {
    default: "border-l-blue-500",
    success: "border-l-green-500",
    warning: "border-l-amber-500",
    error: "border-l-red-500",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={variantClasses[variant]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
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

  const successRate = stats && stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
  const recentBackups = backupsData?.data ?? []

  return (
    <div className="mx-auto max-w-7xl">
      <Header title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("dashboard.totalBackups")} value={String(stats?.total ?? 0)} variant="default" icon={<Database className="h-5 w-5 text-blue-500" />} />
        <StatCard title={t("dashboard.successRate")} value={`${successRate}%`} variant="success" icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
        <StatCard title={t("dashboard.avgDuration")} value={stats ? formatDuration(stats.avgDuration) : "-"} variant="warning" icon={<Clock className="h-5 w-5 text-amber-500" />} />
        <StatCard title={t("dashboard.storageUsed")} value={stats ? formatSize(stats.totalSize) : "-"} variant="error" icon={<HardDrive className="h-5 w-5 text-red-500" />} />
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
                  <div>
                    <p className="text-sm font-medium">{backup.archiveName ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(backup.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={backup.success ? "success" : "destructive"}>{backup.success ? t("status.success") : t("status.failed")}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDuration(backup.durationMs)}</span>
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
                      <span className="text-sm">{system.cpuUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${system.cpuUsage ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.memoryUsage")}</span>
                      <span className="text-sm">{system.memoryUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${system.memoryUsage ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.diskUsage")}</span>
                      <span className="text-sm">{system.diskUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${system.diskUsage ?? 0}%` }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
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
