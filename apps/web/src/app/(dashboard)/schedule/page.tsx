"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { formatDuration, formatDate } from "@/lib/utils"

const cronPresets = [
  { label: "schedule.hourly", value: "0 * * * *" },
  { label: "schedule.daily", value: "0 3 * * *" },
  { label: "schedule.weekly", value: "0 2 * * 0" },
]

export default function SchedulePage() {
  const { t } = useTranslation()
  const [schedule, setSchedule] = useState<{ schedule: string; enabled: boolean; lastRun?: string; nextRun?: string }>({ schedule: "0 3 * * *", enabled: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/schedule`)
      .then((res) => res.json())
      .then((data) => {
        setSchedule(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      })
    } catch {
      alert("Failed to save")
    } finally {
      setSaving(false)
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
        <div className="mx-auto max-w-2xl p-6 pt-20 md:pt-6">
          <Header title={t("schedule.title")} subtitle={t("schedule.subtitle")} />
          <Card>
            <CardHeader><CardTitle>Cron Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cron Expression</Label>
                <Input value={schedule.schedule} onChange={(e) => setSchedule({ ...schedule, schedule: e.target.value })} placeholder="0 3 * * *" />
                <p className="text-xs text-muted-foreground">Format: minute hour day-of-month month day-of-week</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t("schedule.enabled")}</p>
                </div>
                <Switch checked={schedule.enabled} onCheckedChange={(v) => setSchedule({ ...schedule, enabled: v })} />
              </div>
              {schedule.lastRun && (
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{t("schedule.lastRun")}:</span> {formatDate(schedule.lastRun)}
                  </p>
                  {schedule.nextRun && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{t("schedule.nextRun")}:</span> {formatDate(schedule.nextRun)}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("schedule.presets")}</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {cronPresets.map((preset) => (
                    <Button key={preset.value} variant="outline" size="sm" onClick={() => setSchedule({ ...schedule, schedule: preset.value })}>
                      {t(preset.label)}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? t("common.loading") : t("common.save")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
