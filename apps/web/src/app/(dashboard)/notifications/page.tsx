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

export default function NotificationsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<{ discord?: { webhookUrl: string; enabled: boolean } }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/notifications`)
      .then((res) => res.json())
      .then((d) => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch { alert("Failed to save") }
    finally { setSaving(false) }
  }

  const handleTest = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/backups/run`, { method: "POST" })
      if (res.ok) setTestSent(true)
    } catch { /* ignore */ }
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
          <Header title={t("notifications.title")} subtitle={t("notifications.subtitle")} />
          <Card>
            <CardHeader><CardTitle>Discord Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t("notifications.enabled")}</span>
                <Switch checked={data.discord?.enabled ?? false} onCheckedChange={(v) => setData({ ...data, discord: { webhookUrl: data.discord?.webhookUrl ?? "", enabled: v } })} />
              </div>
              <div className="space-y-2">
                <Label>{t("notifications.webhookUrl")}</Label>
                <Input value={data.discord?.webhookUrl ?? ""} onChange={(e) => setData({ ...data, discord: { webhookUrl: e.target.value, enabled: data.discord?.enabled ?? false } })} placeholder={t("notifications.webhookUrlPlaceholder")} />
              </div>
              <Button variant="outline" onClick={handleTest}>
                {t("notifications.testNotification")}
              </Button>
              {testSent && <Badge variant="success">{t("notifications.testSuccess")}</Badge>}
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
