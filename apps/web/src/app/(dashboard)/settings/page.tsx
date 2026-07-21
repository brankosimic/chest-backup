"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/layout/header"
import { formatDate } from "@/lib/utils"
import { useSchedule, useUpdateSchedule, useRetention, useUpdateRetention } from "@/hooks/use-queries"

const cronPresets = [
  { label: "schedule.hourly", value: "0 * * * *" },
  { label: "schedule.daily", value: "0 3 * * *" },
  { label: "schedule.weekly", value: "0 2 * * 0" },
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [tempDir, setTempDir] = useState(() => localStorage.getItem("chest-backup-tempDir") ?? "/tmp")
  const [language, setLanguage] = useState(() => localStorage.getItem("chest-backup-language") ?? i18n.language)

  const { data: scheduleData } = useSchedule()
  const updateScheduleMutation = useUpdateSchedule()
  const [schedule, setSchedule] = useState("0 3 * * *")
  const [enabled, setEnabled] = useState(true)

  const { data: retentionData } = useRetention()
  const updateRetentionMutation = useUpdateRetention()
  const [globalRetention, setGlobalRetention] = useState(7)

  useEffect(() => {
    if (scheduleData) {
      setSchedule(scheduleData.schedule)
      setEnabled(scheduleData.enabled)
    }
  }, [scheduleData])

  useEffect(() => {
    if (retentionData) {
      setGlobalRetention(retentionData.globalRetention)
    }
  }, [retentionData])

  const handleSaveGeneral = () => {
    try {
      localStorage.setItem("chest-backup-tempDir", tempDir)
      localStorage.setItem("chest-backup-language", language)
    } catch { /* ignore */ }
  }

  const handleSaveSchedule = () => {
    updateScheduleMutation.mutate({ schedule, enabled })
  }

  const handleSaveRetention = () => {
    updateRetentionMutation.mutate({ globalRetention })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Header title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <Card>
        <CardHeader><CardTitle>{t("settings.general")}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.tempDir")}</Label>
            <Input value={tempDir} onChange={(e) => { setTempDir(e.target.value); }} placeholder={t("settings.tempDirPlaceholder")} />
          </div>

          <div className="space-y-2">
            <Label>{t("settings.language")}</Label>
            <Select value={language} onChange={(e) => { setLanguage(e.target.value); }}>
              <option value="en">English</option>
              <option value="bs">Bosanski</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("settings.theme")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.themeComingSoon")}</p>
          </div>

          <Button onClick={handleSaveGeneral} className="w-full">{t("common.save")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("settings.schedule")}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.cronExpression")}</Label>
            <Input value={schedule} onChange={(e) => { setSchedule(e.target.value); }} placeholder="0 3 * * *" />
            <p className="text-xs text-muted-foreground">Format: minute hour day-of-month month day-of-week</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("settings.scheduleEnabled")}</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {scheduleData?.lastRun && (
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{t("settings.lastRun")}:</span> {formatDate(scheduleData.lastRun)}
              </p>
              {scheduleData.nextRun && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{t("settings.nextRun")}:</span> {formatDate(scheduleData.nextRun)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("settings.presets")}</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {cronPresets.map((preset) => (
                <Button key={preset.value} variant="outline" size="sm" onClick={() => { setSchedule(preset.value); }}>
                  {t(preset.label)}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveSchedule} disabled={updateScheduleMutation.isPending} className="w-full">
            {updateScheduleMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("settings.retention")}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.globalRetention")}</Label>
            <Input type="number" min={1} value={globalRetention} onChange={(e) => { setGlobalRetention(Number(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{t("settings.retentionDays")}</p>
          </div>

          <Button onClick={handleSaveRetention} disabled={updateRetentionMutation.isPending} className="w-full">
            {updateRetentionMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
