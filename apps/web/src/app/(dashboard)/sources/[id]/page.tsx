"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { useSource, useUpdateSource } from "@/hooks/use-queries"

export default function SourceEditPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: source, isLoading } = useSource(id)
  const updateMutation = useUpdateSource()
  const [form, setForm] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (source) setForm(source as unknown as Record<string, unknown>)
  }, [source])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: form })
      router.push("/sources")
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

  if (!source) return null

  const type = (form.type as string) ?? source.type

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("sources.editSource")} subtitle={`Type: ${source.type}`} />

      <Card>
        <CardHeader>
          <CardTitle>Source Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onChange={(e) => { setForm({ ...form, type: e.target.value }); }}>
              <option value="path">Path</option>
              <option value="postgres">PostgreSQL</option>
              <option value="postgres-container">PostgreSQL Container</option>
              <option value="docker-compose">Docker Compose</option>
            </Select>
          </div>

          {type === "path" && (
            <div className="space-y-2">
              <Label>Path</Label>
              <Input value={(form.path as string) ?? ""} onChange={(e) => { setForm({ ...form, path: e.target.value }); }} placeholder="/data/documents" />
            </div>
          )}

          {type === "postgres" && (
            <>
              <div className="space-y-2"><Label>Host</Label><Input value={(form.host as string) ?? ""} onChange={(e) => { setForm({ ...form, host: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Port</Label><Input type="number" value={(form.port as number) ?? 5432} onChange={(e) => { setForm({ ...form, port: Number(e.target.value) }); }} /></div>
              <div className="space-y-2"><Label>User</Label><Input value={(form.user as string) ?? ""} onChange={(e) => { setForm({ ...form, user: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={(form.password as string) ?? ""} onChange={(e) => { setForm({ ...form, password: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Database</Label><Input value={(form.database as string) ?? ""} onChange={(e) => { setForm({ ...form, database: e.target.value }); }} /></div>
            </>
          )}

          {type === "postgres-container" && (
            <>
              <div className="space-y-2"><Label>Container Name</Label><Input value={(form.containerName as string) ?? ""} onChange={(e) => { setForm({ ...form, containerName: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>User</Label><Input value={(form.user as string) ?? ""} onChange={(e) => { setForm({ ...form, user: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={(form.password as string) ?? ""} onChange={(e) => { setForm({ ...form, password: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Database</Label><Input value={(form.database as string) ?? ""} onChange={(e) => { setForm({ ...form, database: e.target.value }); }} /></div>
            </>
          )}

          {type === "docker-compose" && (
            <>
              <div className="space-y-2"><Label>Name</Label><Input value={(form.name as string) ?? ""} onChange={(e) => { setForm({ ...form, name: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Path</Label><Input value={(form.path as string) ?? ""} onChange={(e) => { setForm({ ...form, path: e.target.value }); }} /></div>
              <div className="space-y-2"><Label>Containers (comma-separated)</Label><Input value={((form.containers as string[]) ?? []).join(", ")} onChange={(e) => { setForm({ ...form, containers: e.target.value.split(",").map((c) => c.trim()) }); }} /></div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => { router.push("/sources"); }}>{t("common.cancel")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
