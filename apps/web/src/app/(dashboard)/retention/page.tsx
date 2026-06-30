"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/header"
import { useRetention, useUpdateRetention } from "@/hooks/use-queries"

export default function RetentionPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useRetention()
  const updateMutation = useUpdateRetention()
  const [globalRetention, setGlobalRetention] = useState(7)
  const [destRetentions, setDestRetentions] = useState<{ id: string; retention: number }[]>([])

  useEffect(() => {
    if (data) {
      setGlobalRetention(data.globalRetention)
      setDestRetentions(data.destinations)
    }
  }, [data])

  const handleSave = () => {
    updateMutation.mutate({ globalRetention, destinations: destRetentions })
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
      <Header title={t("retention.title")} subtitle={t("retention.subtitle")} />

      <Card>
        <CardHeader><CardTitle>Global Retention</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("retention.globalRetention")}</Label>
            <Input type="number" min={1} value={globalRetention} onChange={(e) => setGlobalRetention(Number(e.target.value))} />
          </div>

          <div className="space-y-3">
            <Label>{t("retention.destinationRetention")}</Label>
            {destRetentions.map((dest) => (
              <div key={dest.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex-1 text-sm font-mono">Dest {dest.id.slice(0, 8)}...</span>
                <Input type="number" min={1} className="w-24" value={dest.retention} onChange={(e) => {
                  setDestRetentions((prev) =>
                    prev.map((d) => d.id === dest.id ? { ...d, retention: Number(e.target.value) } : d)
                  )
                }} />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? t("common.loading") : t("retention.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
