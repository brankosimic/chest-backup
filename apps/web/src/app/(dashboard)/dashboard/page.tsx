"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { formatDuration, formatSize, formatUptime } from "@/lib/utils"

interface DashboardData {
  backups: { total: number; success: number; failed: number; avgDuration: number; totalSize: number }
  system: { status: string; uptime: number; version: string; cpuUsage: number; memoryUsage: number; diskUsage: number }
  recentBackups: { id: string; timestamp: string; success: boolean; archiveName?: string; durationMs: number; errors: string[] }[]
}

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
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [backupsRes, systemRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/backups/stats`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/system`),
        ])
        const backupsData = await backupsRes.json()
        const systemData = await systemRes.json()

        const recentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/backups?page=1&limit=5`)
        const recentData = await recentRes.json()

        setData({
          backups: backupsData.data,
          system: systemData.data,
          recentBackups: recentData.data.data,
        })
      } catch {
        setData({
          backups: { total: 0, success: 0, failed: 0, avgDuration: 0, totalSize: 0 },
          system: { status: "unknown", uptime: 0, version: "1.0.0", cpuUsage: 0, memoryUsage: 0, diskUsage: 0 },
          recentBackups: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const successRate = (data?.backups.total ?? 0) > 0 ? Math.round(((data?.backups.success ?? 0) / (data?.backups.total ?? 0)) * 100) : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 pt-20 md:pt-6">
          <Header title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t("dashboard.totalBackups")} value={String(data?.backups.total ?? 0)} variant="default" icon={<svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>} />
            <StatCard title={t("dashboard.successRate")} value={`${successRate}%`} variant="success" icon={<svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
            <StatCard title={t("dashboard.avgDuration")} value={data ? formatDuration(data.backups.avgDuration) : "-"} variant="warning" icon={<svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
            <StatCard title={t("dashboard.storageUsed")} value={data ? formatSize(data.backups.totalSize) : "-"} variant="error" icon={<svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.recentBackups")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.recentBackups.map((backup) => (
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
                  {!data?.recentBackups.length && <p className="text-center text-sm text-muted-foreground">{t("common.noResults")}</p>}
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
                    <Badge variant={data?.system.status === "running" ? "success" : "destructive"}>{data?.system.status ?? "unknown"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("dashboard.uptime")}</span>
                    <span className="text-sm">{formatUptime(data?.system.uptime ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("dashboard.version")}</span>
                    <span className="text-sm">{data?.system.version ?? "-"}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.cpuUsage")}</span>
                      <span className="text-sm">{data?.system.cpuUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${data?.system.cpuUsage ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.memoryUsage")}</span>
                      <span className="text-sm">{data?.system.memoryUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${data?.system.memoryUsage ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("dashboard.diskUsage")}</span>
                      <span className="text-sm">{data?.system.diskUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${data?.system.diskUsage ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Button variant="default" size="lg">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t("dashboard.runBackup")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
