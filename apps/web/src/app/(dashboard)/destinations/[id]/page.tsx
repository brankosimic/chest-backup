"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"

interface Destination {
  id: string
  type: string
  path: string
  host?: string
  port?: number
  user?: string
  password?: string
  privateKey?: string
  retention?: number
  parallel?: boolean
  timeout?: number
  skip?: boolean
}

export default function DestinationEditPage(props: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  const [dest, setDest] = useState<Destination | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const params = await props.params
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/destinations/${params.id}`)
        const data = await res.json()
        setDest(data.data)
      } catch {
        // not found
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [props.params])

  const handleSave = async () => {
    if (!dest) return
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/destinations/${dest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dest),
      })
      window.location.href = "/destinations"
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

  if (!dest) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl p-6 pt-20 md:pt-6">
          <Header title={t("destinations.editDestination")} subtitle={`Type: ${dest.type}`} />
          <Card>
            <CardHeader><CardTitle>Destination Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={dest.type} onChange={(e) => setDest({ ...dest, type: e.target.value })}>
                  <option value="local">Local</option>
                  <option value="sftp">SFTP</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Path</Label>
                <Input value={dest.path} onChange={(e) => setDest({ ...dest, path: e.target.value })} />
              </div>
              {dest.type === "sftp" && (
                <>
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input value={dest.host ?? ""} onChange={(e) => setDest({ ...dest, host: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input type="number" value={dest.port ?? 22} onChange={(e) => setDest({ ...dest, port: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Input value={dest.user ?? ""} onChange={(e) => setDest({ ...dest, user: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={dest.password ?? ""} onChange={(e) => setDest({ ...dest, password: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Private Key</Label>
                    <Input value={dest.privateKey ?? ""} onChange={(e) => setDest({ ...dest, privateKey: e.target.value })} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Retention (days)</Label>
                <Input type="number" value={dest.retention ?? ""} onChange={(e) => setDest({ ...dest, retention: Number(e.target.value) })} />
              </div>
              {dest.type === "sftp" && (
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input type="number" value={dest.timeout ?? ""} onChange={(e) => setDest({ ...dest, timeout: Number(e.target.value) })} />
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">Parallel Upload</span>
                <Switch checked={dest.parallel ?? false} onCheckedChange={(v) => setDest({ ...dest, parallel: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">Skip this destination</span>
                <Switch checked={dest.skip ?? false} onCheckedChange={(v) => setDest({ ...dest, skip: v })} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving}>{saving ? t("common.loading") : t("common.save")}</Button>
                <Button variant="outline" onClick={() => window.location.href = "/destinations"}>{t("common.cancel")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
