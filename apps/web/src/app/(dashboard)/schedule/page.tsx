"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/layout/header"
import { formatDate } from "@/lib/utils"
import { useSchedule, useUpdateSchedule } from "@/hooks/use-queries"

const cronPresets = [
  { label: "schedule.hourly", value: "0 * * * *" },
  { label: "schedule.daily", value: "0 3 * * *" },
  { label: "schedule.weekly", value: "0 2 * * 0" },
]

export default function SchedulePage() {
  const { t } = useTranslation()
  const { data, isLoading } = useSchedule()
  const updateMutation = useUpdateSchedule()
  const [schedule, setSchedule] = useState("0 3 * * *")
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (data) {
      setSchedule(data.schedule)
      setEnabled(data.enabled)
    }
  }, [data])

  const handleSave = () => {
    updateMutation.mutate({ schedule, enabled })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("schedule.title")} subtitle={t("schedule.subtitle")} />

      <Card>
        <CardHeader><CardTitle>Cron Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="0 3 * * *" />
            <p className="text-xs text-muted-foreground">Format: minute hour day-of-month month day-of-week</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("schedule.enabled")}</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {data?.lastRun && (
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{t("schedule.lastRun")}:</span> {formatDate(data.lastRun)}
              </p>
              {data.nextRun && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{t("schedule.nextRun")}:</span> {formatDate(data.nextRun)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("schedule.presets")}</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {cronPresets.map((preset) => (
                <Button key={preset.value} variant="outline" size="sm" onClick={() => setSchedule(preset.value)}>
                  {t(preset.label)}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
