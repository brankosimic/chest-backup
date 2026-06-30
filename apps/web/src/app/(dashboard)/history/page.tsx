"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { formatDuration, formatDate } from "@/lib/utils"
import { useBackups } from "@/hooks/use-queries"

export default function HistoryPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useBackups(1, 50)
  const backups = data?.data ?? []

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
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
  )
}
