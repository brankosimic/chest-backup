import { useTranslation } from "react-i18next"
import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { useSource, useUpdateSource } from "@/hooks/use-queries"
import { fetchDockerContainers, fetchContainerVolumes } from "@/lib/api-client"
import type { ContainerVolume } from "@/lib/api-client"

const getTypeDefault = (type: string, source: Record<string, unknown>): Record<string, unknown> => {
  switch (type) {
    case "path": return { path: source.path ?? "" }
    case "postgres": return {
      host: source.host ?? "localhost",
      port: source.port ?? 5432,
      user: source.user ?? "",
      password: source.password ?? "",
      database: source.database ?? "",
    }
    case "postgres-container": return {
      containerName: source.containerName ?? "",
      user: source.user ?? "",
      password: source.password ?? "",
      database: source.database ?? "",
    }
    case "container-volume": return {
      containerName: source.containerName ?? "",
      volumePath: source.volumePath ?? "",
      include: (source.include as string[] | undefined)?.join("\n") ?? "",
    }
    default: return {}
  }
}

export default function SourceEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() as { id: string }

  const { data: source, isLoading } = useSource(id)
  const updateMutation = useUpdateSource()
  const [type, setType] = useState("path")
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [isFormReady, setIsFormReady] = useState(false)

  const [dockerContainers, setDockerContainers] = useState<string[]>([])
  const [dockerContainersLoading, setDockerContainersLoading] = useState(false)
  const [dockerContainersError, setDockerContainersError] = useState("")
  const [cvVolumes, setCvVolumes] = useState<ContainerVolume[]>([])
  const [cvVolumesError, setCvVolumesError] = useState("")

  useEffect(() => {
    if (source) {
      const t = source.type
      setType(t)
      setForm({
        ...getTypeDefault(t, source as unknown as Record<string, unknown>),
      })
      setIsFormReady(true)
    }
  }, [source])

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    setDockerContainersLoading(true)
    setDockerContainersError("")
    fetchDockerContainers()
      .then(setDockerContainers)
      .catch(() => setDockerContainersError("Failed to list containers"))
      .finally(() => setDockerContainersLoading(false))
  }, [])

  const fetchVolumes = useCallback(async () => {
    const cvContainerName = form.containerName as string
    if (!cvContainerName) return
    setCvVolumesError("")
    try {
      const res = await fetchContainerVolumes(cvContainerName)
      setCvVolumes(res)
      if (!res.length) setCvVolumesError(t("sources.noVolumes"))
    } catch {
      setCvVolumesError(t("sources.fetchVolumesError"))
    }
  }, [form.containerName])

  useEffect(() => {
    if (type === "container-volume" && form.containerName) void fetchVolumes()
  }, [type, form.containerName, fetchVolumes])

  const handleSave = async () => {
    const body: Record<string, unknown> = { type }

    switch (type) {
      case "path":
        body.path = form.path
        break
      case "postgres":
        body.host = form.host
        body.port = Number(form.port) || 5432
        body.user = form.user
        body.password = form.password
        body.database = form.database
        break
      case "postgres-container":
        body.containerName = form.containerName
        body.user = form.user
        body.password = form.password
        body.database = form.database
        break
      case "container-volume": {
        body.containerName = form.containerName
        body.volumePath = form.volumePath
        const patterns = ((form.include as string) ?? "").split("\n").map((s: string) => s.trim()).filter(Boolean)
        if (patterns.length) body.include = patterns
        break
      }
    }

    try {
      await updateMutation.mutateAsync({ id, data: body })
      navigate("/sources")
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

  if (!source || !isFormReady) return null

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
            <Select value={type} onChange={(e) => { setType(e.target.value); setForm(getTypeDefault(e.target.value, {})); }}>
              <option value="path">Path</option>
              <option value="postgres">PostgreSQL</option>
              <option value="postgres-container">PostgreSQL Container</option>
              <option value="container-volume">Container Volume</option>
            </Select>
          </div>

          {type === "path" && (
            <div className="space-y-2">
              <Label>Path</Label>
              <Input value={(form.path as string) ?? ""} onChange={(e) => { update("path", e.target.value); }} placeholder="/data/documents" />
            </div>
          )}

          {type === "postgres" && (
            <>
              <div className="space-y-2"><Label>Host</Label><Input value={(form.host as string) ?? ""} onChange={(e) => { update("host", e.target.value); }} /></div>
              <div className="space-y-2"><Label>Port</Label><Input type="number" value={(form.port as number) ?? 5432} onChange={(e) => { update("port", Number(e.target.value)); }} /></div>
              <div className="space-y-2"><Label>User</Label><Input value={(form.user as string) ?? ""} onChange={(e) => { update("user", e.target.value); }} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={(form.password as string) ?? ""} onChange={(e) => { update("password", e.target.value); }} /></div>
              <div className="space-y-2"><Label>Database</Label><Input value={(form.database as string) ?? ""} onChange={(e) => { update("database", e.target.value); }} /></div>
            </>
          )}

          {type === "postgres-container" && (
            <>
              <div className="space-y-2"><Label>Container Name</Label><Input value={(form.containerName as string) ?? ""} onChange={(e) => { update("containerName", e.target.value); }} /></div>
              <div className="space-y-2"><Label>User</Label><Input value={(form.user as string) ?? ""} onChange={(e) => { update("user", e.target.value); }} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={(form.password as string) ?? ""} onChange={(e) => { update("password", e.target.value); }} /></div>
              <div className="space-y-2"><Label>Database</Label><Input value={(form.database as string) ?? ""} onChange={(e) => { update("database", e.target.value); }} /></div>
            </>
          )}

          {type === "container-volume" && (
            <>
              <div className="space-y-2">
                <Label>{t("sources.containerName")}</Label>
                <Select
                  value={(form.containerName as string) ?? ""}
                  onChange={(e) => { update("containerName", e.target.value); update("volumePath", ""); }}
                  disabled={dockerContainersLoading || !!dockerContainersError}
                >
                  <option value="" disabled>{dockerContainersLoading ? t("common.loading") : dockerContainersError ? t("sources.containerFetchError") : t("sources.selectContainer")}</option>
                  {dockerContainers.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {(form.containerName as string) && !dockerContainers.includes(form.containerName as string) && (
                    <option value={form.containerName as string}>{form.containerName as string}</option>
                  )}
                </Select>
                {dockerContainersLoading && <p className="text-xs text-muted-foreground">{t("common.loading")}</p>}
                {dockerContainersError && <p className="text-xs text-muted-foreground">{dockerContainersError}</p>}
              </div>

              {form.containerName && (
                <div className="space-y-2">
                  <Label>{t("sources.volumePath")}</Label>
                  <Select
                    value={(form.volumePath as string) ?? ""}
                    onChange={(e) => { update("volumePath", e.target.value); }}
                    disabled={!!cvVolumesError}
                  >
                    <option value="" disabled>{cvVolumesError ? t("sources.noVolumes") : t("sources.selectVolumePath")}</option>
                    {cvVolumes.map((v, i) => (
                      <option key={`${v.source}-${i}`} value={v.source}>
                        {v.destination} → {v.source}{v.name ? ` (${v.name})` : ""}
                      </option>
                    ))}
                  </Select>
                  {cvVolumesError && <p className="text-xs text-muted-foreground">{cvVolumesError}</p>}
                </div>
              )}

              {(form.volumePath as string) && (
                <div className="space-y-2">
                  <Label>{t("sources.includePatterns")}</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={(form.include as string) ?? ""}
                    onChange={(e) => { update("include", e.target.value); }}
                    placeholder="logs/*&#10;config/*&#10;data/**/*.db"
                  />
                  <p className="text-xs text-muted-foreground">{t("sources.includePatternsHint")}</p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => { navigate("/sources"); }}>{t("common.cancel")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
