"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"

interface Source {
  id: string
  type: string
  path?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  containerName?: string
  name?: string
  containers?: string[]
}

export default function SourceEditPage(props: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [source, setSource] = useState<Source | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSource = async () => {
      const params = await props.params
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/sources/${params.id}`)
        const data = await res.json()
        setSource(data.data)
      } catch {
        router.push("/sources")
      } finally {
        setLoading(false)
      }
    }
    loadSource()
  }, [props.params, router])

  const handleSave = async () => {
    if (!source) return
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/sources/${source.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
      })
      router.push("/sources")
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

  if (!source) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl p-6 pt-20 md:pt-6">
          <Header title={t("sources.editSource")} subtitle={`Type: ${source.type}`} />

          <Card>
            <CardHeader>
              <CardTitle>Source Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={source.type}
                  onChange={(e) => setSource({ ...source, type: e.target.value })}
                >
                  <option value="path">Path</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="postgres-container">PostgreSQL Container</option>
                  <option value="docker-compose">Docker Compose</option>
                </Select>
              </div>

              {source.type === "path" && (
                <div className="space-y-2">
                  <Label>Path</Label>
                  <Input
                    value={source.path ?? ""}
                    onChange={(e) => setSource({ ...source, path: e.target.value })}
                    placeholder="/data/documents"
                  />
                </div>
              )}

              {source.type === "postgres" && (
                <>
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input value={source.host ?? ""} onChange={(e) => setSource({ ...source, host: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input type="number" value={source.port ?? 5432} onChange={(e) => setSource({ ...source, port: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Input value={source.user ?? ""} onChange={(e) => setSource({ ...source, user: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={source.password ?? ""} onChange={(e) => setSource({ ...source, password: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Database</Label>
                    <Input value={source.database ?? ""} onChange={(e) => setSource({ ...source, database: e.target.value })} />
                  </div>
                </>
              )}

              {source.type === "postgres-container" && (
                <>
                  <div className="space-y-2">
                    <Label>Container Name</Label>
                    <Input value={source.containerName ?? ""} onChange={(e) => setSource({ ...source, containerName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Input value={source.user ?? ""} onChange={(e) => setSource({ ...source, user: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={source.password ?? ""} onChange={(e) => setSource({ ...source, password: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Database</Label>
                    <Input value={source.database ?? ""} onChange={(e) => setSource({ ...source, database: e.target.value })} />
                  </div>
                </>
              )}

              {source.type === "docker-compose" && (
                <>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={source.name ?? ""} onChange={(e) => setSource({ ...source, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Path</Label>
                    <Input value={source.path ?? ""} onChange={(e) => setSource({ ...source, path: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Containers (comma-separated)</Label>
                    <Input
                      value={(source.containers ?? []).join(", ")}
                      onChange={(e) => setSource({ ...source, containers: e.target.value.split(",").map((c) => c.trim()) })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? t("common.loading") : t("common.save")}
                </Button>
                <Button variant="outline" onClick={() => router.push("/sources")}>
                  {t("common.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
