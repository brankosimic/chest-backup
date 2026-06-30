"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { formatDuration, formatDate } from "@/lib/utils"

export default function HistoryPage() {
  const { t } = useTranslation()
  const [backups, setBackups] = useState<{ id: string; timestamp: string; success: boolean; archiveName?: string; durationMs: number; errors: string[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/backups?page=1&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setBackups(data.data.data)
        setLoading(false)
      })
      .catch(() => {
        setBackups([])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 pt-20 md:pt-6">
          <Header title={t("history.title")} subtitle={t("history.subtitle")} />
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("history.timestamp")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("history.status")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("history.duration")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("history.size")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("history.errors")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">{formatDate(backup.timestamp)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={backup.success ? "success" : "destructive"}>
                            {backup.success ? t("status.success") : t("status.failed")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDuration(backup.durationMs)}</td>
                        <td className="px-4 py-3 text-sm font-mono">{backup.archiveName ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-destructive">{backup.errors?.join(", ")}</td>
                      </tr>
                    ))}
                    {!backups.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("history.noHistory")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
