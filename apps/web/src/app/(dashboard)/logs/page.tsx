"use client"

import { useTranslation } from "react-i18next"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { formatDate } from "@/lib/utils"
import { useLogs } from "@/hooks/use-queries"

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

export default function LogsPage() {
  const { t } = useTranslation()
  const [levelFilter, setLevelFilter] = useState("all")
  const [search, setSearch] = useState("")
  const { data, isLoading } = useLogs(levelFilter, search)
  const logs = data?.data ?? []

  return (
    <div className="mx-auto max-w-7xl">
      <Header title={t("logs.title")} subtitle={t("logs.subtitle")} />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); }}>
          <option value="all">{t("logs.allLevels")}</option>
          <option value="debug">{t("logs.debug")}</option>
          <option value="info">{t("logs.info")}</option>
          <option value="warn">{t("logs.warn")}</option>
          <option value="error">{t("logs.error")}</option>
          <option value="fatal">{t("logs.fatal")}</option>
        </Select>
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b px-4 py-3 flex items-start gap-3">
                  <Badge variant={levelBadgeVariant(log.level)} className="mt-0.5 shrink-0">{log.level}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono truncate">{log.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
            {!isLoading && !logs.length && <p className="p-8 text-center text-muted-foreground">{t("logs.noLogs")}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
