"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { formatDate } from "@/lib/utils"

type LogEntry = { id: string; timestamp: string; level: string; message: string }

export default function LogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const params = new URLSearchParams()
    if (levelFilter !== "all") params.set("level", levelFilter)
    if (search) params.set("search", search)
    params.set("limit", "100")

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/logs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.data.data)
        setLoading(false)
      })
      .catch(() => {
        setLogs([])
        setLoading(false)
      })
  }, [levelFilter, search])

  const levelBadgeVariant = (level: string) => {
    switch (level) {
      case "error":
      case "fatal": return "destructive"
      case "warn": return "warning"
      case "info": return "default"
      case "debug": return "secondary"
      default: return "outline"
    }
  }

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
          <Header title={t("logs.title")} subtitle={t("logs.subtitle")} />
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="all">{t("logs.allLevels")}</option>
              <option value="debug">{t("logs.debug")}</option>
              <option value="info">{t("logs.info")}</option>
              <option value="warn">{t("logs.warn")}</option>
              <option value="error">{t("logs.error")}</option>
              <option value="fatal">{t("logs.fatal")}</option>
            </Select>
            <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border-b px-4 py-3 flex items-start gap-3">
                    <Badge variant={levelBadgeVariant(log.level)} className="mt-0.5 shrink-0">{log.level}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono truncate">{log.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {!logs.length && <p className="p-8 text-center text-muted-foreground">{t("logs.noLogs")}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
