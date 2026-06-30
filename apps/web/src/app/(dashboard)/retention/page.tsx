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

interface RetentionDest { id: string; retention: number }

export default function RetentionPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<{ globalRetention: number; destinations: RetentionDest[] }>({ globalRetention: 7, destinations: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/retention`)
      .then((res) => res.json())
      .then((d) => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/retention`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch { alert("Failed to save") }
    finally { setSaving(false) }
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
          <Header title={t("retention.title")} subtitle={t("retention.subtitle")} />
          <Card>
            <CardHeader><CardTitle>Global Retention</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("retention.globalRetention")}</Label>
                <Input type="number" min={1} value={data.globalRetention} onChange={(e) => setData({ ...data, globalRetention: Number(e.target.value) })} />
              </div>
              <div className="space-y-3">
                <Label>{t("retention.destinationRetention")}</Label>
                {data.destinations.map((dest) => (
                  <div key={dest.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex-1 text-sm font-mono">Dest {dest.id.slice(0, 8)}...</span>
                    <Input type="number" min={1} className="w-24" value={dest.retention} onChange={(e) => {
                      const updated = data.destinations.map((d) => d.id === dest.id ? { ...d, retention: Number(e.target.value) } : d)
                      setData({ ...data, destinations: updated })
                    }} />
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? t("common.loading") : t("retention.save")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
