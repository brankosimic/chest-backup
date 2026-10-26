"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { ExclusionsCard } from "@/components/settings/exclusions-card"
import { formatDate } from "@/lib/utils"
import { useSchedule, useUpdateSchedule, useRetention, useUpdateRetention, useNotifications, useUpdateNotifications, useTestNotification } from "@/hooks/use-queries"
import type { RetentionSettings } from "@/types/mutations"

const cronPresets = [
  { label: "schedule.hourly", value: "0 * * * *" },
  { label: "schedule.daily", value: "0 3 * * *" },
  { label: "schedule.weekly", value: "0 2 * * 0" },
]

const retentionModes = [
  { label: "settings.retentionModeMonths", value: "months" },
  { label: "settings.retentionModeWeeks", value: "weeks" },
  { label: "settings.retentionModeForever", value: "forever" },
] as const

const retentionUnitKeys: Record<string, string> = {
  months: "settings.retentionModeMonthsUnit",
  weeks: "settings.retentionModeWeeksUnit",
}

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
  const [retentionMode, setRetentionMode] = useState<RetentionSettings["retentionMode"]>("months")

  const { data: notificationData } = useNotifications()
  const updateNotificationsMutation = useUpdateNotifications()
  const testNotificationMutation = useTestNotification()
  const [webhookUrl, setWebhookUrl] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    if (scheduleData) {
      setSchedule(scheduleData.schedule)
      setEnabled(scheduleData.enabled)
    }
  }, [scheduleData])

  useEffect(() => {
    if (retentionData) {
      setGlobalRetention(retentionData.globalRetention)
      setRetentionMode(retentionData.retentionMode)
    }
  }, [retentionData])

  useEffect(() => {
    if (notificationData?.discord) {
      setWebhookUrl(notificationData.discord.webhookUrl)
      setNotificationsEnabled(notificationData.discord.enabled)
    }
  }, [notificationData])

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate({ discord: { webhookUrl, enabled: notificationsEnabled } })
  }

  const handleTestNotification = () => {
    testNotificationMutation.mutate(webhookUrl, {
      onSuccess: () => {
        setTestSent(true)
      },
      onError: () => {
        setTestSent(false)
      },
    })
  }

  const handleSaveGeneral = () => {
    try {
      localStorage.setItem("chest-backup-tempDir", tempDir)
      localStorage.setItem("chest-backup-language", language)
    } catch {
      /* ignore */
    }
  }

  const handleSaveSchedule = () => {
    updateScheduleMutation.mutate({ schedule, enabled })
  }

  const handleSaveRetention = () => {
    updateRetentionMutation.mutate({ globalRetention, retentionMode })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Header title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.general")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.tempDir")}</Label>
            <Input
              value={tempDir}
              onChange={(e) => {
                setTempDir(e.target.value)
              }}
              placeholder={t("settings.tempDirPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("settings.language")}</Label>
            <Select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value)
              }}
            >
              <option value="en">English</option>
              <option value="bs">Bosanski</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("settings.theme")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.themeComingSoon")}</p>
          </div>

          <Button onClick={handleSaveGeneral} className="w-full">
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.schedule")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.cronExpression")}</Label>
            <Input
              value={schedule}
              onChange={(e) => {
                setSchedule(e.target.value)
              }}
              placeholder="0 3 * * *"
            />
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
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSchedule(preset.value)
                  }}
                >
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

      <ExclusionsCard />

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.retention")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.retentionMode")}</Label>
            <Select
              value={retentionMode}
              onChange={(e) => {
                setRetentionMode(e.target.value as RetentionSettings["retentionMode"])
              }}
            >
              {retentionModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {t(mode.label)}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">{t("settings.retentionModeDescription")}</p>
          </div>

          {retentionMode !== "forever" && (
            <div className="space-y-2">
              <Label>{t("settings.globalRetention")}</Label>
              <Input
                type="number"
                min={1}
                value={globalRetention}
                onChange={(e) => {
                  setGlobalRetention(Number(e.target.value))
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t(retentionUnitKeys[retentionMode] ?? "settings.retentionDays")}
              </p>
            </div>
          )}

          <Button onClick={handleSaveRetention} disabled={updateRetentionMutation.isPending} className="w-full">
            {updateRetentionMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">{t("notifications.enabled")}</span>
            <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>

          <div className="space-y-2">
            <Label>{t("notifications.webhookUrl")}</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value)
              }}
              placeholder={t("notifications.webhookUrlPlaceholder")}
            />
          </div>

          <Button variant="outline" onClick={handleTestNotification} disabled={testNotificationMutation.isPending}>
            {testNotificationMutation.isPending ? t("common.loading") : t("notifications.testNotification")}
          </Button>

          {testSent && <Badge variant="success">{t("notifications.testSuccess")}</Badge>}

          <Button onClick={handleSaveNotifications} disabled={updateNotificationsMutation.isPending} className="w-full">
            {updateNotificationsMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
