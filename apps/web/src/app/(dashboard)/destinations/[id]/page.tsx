"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/layout/header"
import { useDestination, useUpdateDestination } from "@/hooks/use-queries"

export default function DestinationEditPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: dest, isLoading } = useDestination(id)
  const updateMutation = useUpdateDestination()
  const [form, setForm] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (dest) setForm(dest as unknown as Record<string, unknown>)
  }, [dest])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: form })
      router.push("/destinations")
    } catch {
      alert("Failed to save")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!dest) return null

  const type = (form.type as string) ?? dest.type

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("destinations.editDestination")} subtitle={`Type: ${type}`} />

      <Card>
        <CardHeader><CardTitle>Destination Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="local">Local</option>
              <option value="sftp">SFTP</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Path</Label>
            <Input value={(form.path as string) ?? ""} onChange={(e) => setForm({ ...form, path: e.target.value })} />
          </div>

          {type === "sftp" && (
            <>
              <div className="space-y-2"><Label>Host</Label><Input value={(form.host as string) ?? ""} onChange={(e) => setForm({ ...form, host: e.target.value })} /></div>
              <div className="space-y-2"><Label>Port</Label><Input type="number" value={(form.port as number) ?? 22} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>User</Label><Input value={(form.user as string) ?? ""} onChange={(e) => setForm({ ...form, user: e.target.value })} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={(form.password as string) ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="space-y-2"><Label>Private Key</Label><Input value={(form.privateKey as string) ?? ""} onChange={(e) => setForm({ ...form, privateKey: e.target.value })} /></div>
            </>
          )}

          <div className="space-y-2">
            <Label>Retention (days)</Label>
            <Input type="number" value={(form.retention as number) ?? ""} onChange={(e) => setForm({ ...form, retention: Number(e.target.value) })} />
          </div>

          {type === "sftp" && (
            <div className="space-y-2">
              <Label>Timeout (seconds)</Label>
              <Input type="number" value={(form.timeout as number) ?? ""} onChange={(e) => setForm({ ...form, timeout: Number(e.target.value) })} />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Parallel Upload</span>
            <Switch checked={(form.parallel as boolean) ?? false} onCheckedChange={(v) => setForm({ ...form, parallel: v })} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Skip this destination</span>
            <Switch checked={(form.skip as boolean) ?? false} onCheckedChange={(v) => setForm({ ...form, skip: v })} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/destinations")}>{t("common.cancel")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
