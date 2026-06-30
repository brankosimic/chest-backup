"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { useNotifications, useUpdateNotifications } from "@/hooks/use-queries"

export default function NotificationsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useNotifications()
  const updateMutation = useUpdateNotifications()
  const [webhookUrl, setWebhookUrl] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    if (data?.discord) {
      setWebhookUrl(data.discord.webhookUrl)
      setEnabled(data.discord.enabled)
    }
  }, [data])

  const handleSave = () => {
    updateMutation.mutate({ discord: { webhookUrl, enabled } })
  }

  const handleTest = () => {
    setTestSent(true)
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
      <Header title={t("notifications.title")} subtitle={t("notifications.subtitle")} />

      <Card>
        <CardHeader><CardTitle>Discord Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">{t("notifications.enabled")}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label>{t("notifications.webhookUrl")}</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder={t("notifications.webhookUrlPlaceholder")}
            />
          </div>

          <Button variant="outline" onClick={handleTest}>
            {t("notifications.testNotification")}
          </Button>

          {testSent && <Badge variant="success">{t("notifications.testSuccess")}</Badge>}

          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
