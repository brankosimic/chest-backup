import { useTranslation } from "react-i18next"
import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { useCreateSource } from "@/hooks/use-queries"
import { fetchDockerContainers, fetchContainerVolumes, fetchPostgresDatabases } from "@/lib/api-client"
import type { SubmitEvent } from "react"
import type { ContainerVolume } from "@/lib/api-client"

type PgType = "postgres" | "postgres-container"

export default function NewSourcePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateSource()
  const [type, setType] = useState("path")
  const [path, setPath] = useState("")
  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState(5432)
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [database, setDatabase] = useState("")
  const [containerName, setContainerName] = useState("")

  const [cvContainerName, setCvContainerName] = useState("")
  const [cvVolumes, setCvVolumes] = useState<ContainerVolume[]>([])
  const [cvVolumesError, setCvVolumesError] = useState("")
  const [volumePath, setVolumePath] = useState("")
  const [include, setInclude] = useState("")

  const [dockerContainers, setDockerContainers] = useState<string[]>([])
  const [dockerContainersLoading, setDockerContainersLoading] = useState(false)
  const [dockerContainersError, setDockerContainersError] = useState("")

  const [databases, setDatabases] = useState<string[]>([])
  const [databasesLoading, setDatabasesLoading] = useState(false)
  const [databasesError, setDatabasesError] = useState("")

  const isPostgres = ["postgres", "postgres-container"].includes(type)

  const isContainer = type === "postgres-container"
  const fieldsReady = isContainer
    ? user && password && containerName
    : user && password && host

  const canCreate = isPostgres
    ? !!(fieldsReady && database)
    : type === "container-volume"
      ? !!(cvContainerName && volumePath)
      : !!path

  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cvFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchDbList = useCallback(async () => {
    if (!user || !password) return
    setDatabasesLoading(true)
    setDatabasesError("")
    try {
      const res = await fetchPostgresDatabases({
        type: type as PgType,
        host: type === "postgres" ? host : undefined,
        port: type === "postgres" ? port : undefined,
        user,
        password,
        containerName: type === "postgres-container" ? containerName : undefined,
      })
      if (res.length) setDatabases(res)
      else {
        setDatabases([])
        setDatabasesError(t("sources.noDatabases"))
      }
    } catch {
      setDatabasesError(t("sources.fetchDatabasesError"))
    } finally {
      setDatabasesLoading(false)
    }
  }, [type, host, port, user, password, containerName])

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    if (!isPostgres || !fieldsReady) return
    fetchTimerRef.current = setTimeout(fetchDbList, 600)
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [fetchDbList, isPostgres, fieldsReady])

  useEffect(() => {
    setDockerContainersLoading(true)
    setDockerContainersError("")
    fetchDockerContainers()
      .then(setDockerContainers)
      .catch(() => setDockerContainersError("Failed to list containers"))
      .finally(() => setDockerContainersLoading(false))
  }, [])

  useEffect(() => {
    setDatabase("")
    setDatabases([])
    setDatabasesError("")
    setContainerName("")
  }, [type])

  useEffect(() => {
    setCvContainerName("")
    setCvVolumes([])
    setCvVolumesError("")
    setVolumePath("")
    setInclude("")
  }, [type])

  const fetchVolumes = useCallback(async () => {
    if (!cvContainerName) return
    setCvVolumesError("")
    try {
      const res = await fetchContainerVolumes(cvContainerName)
      setCvVolumes(res)
      if (!res.length) setCvVolumesError(t("sources.noVolumes"))
    } catch {
      setCvVolumesError(t("sources.fetchVolumesError"))
    }
  }, [cvContainerName])

  useEffect(() => {
    if (cvFetchTimerRef.current) clearTimeout(cvFetchTimerRef.current)
    if (type !== "container-volume" || !cvContainerName) return
    cvFetchTimerRef.current = setTimeout(fetchVolumes, 300)
    return () => {
      if (cvFetchTimerRef.current) clearTimeout(cvFetchTimerRef.current)
    }
  }, [fetchVolumes, type, cvContainerName])

  const handleCreate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const body: Record<string, unknown> = { type }

    if (type === "path") {
      body.path = path
    } else if (type === "postgres") {
      body.host = host
      body.port = port
      body.user = user
      body.password = password
      body.database = database
    } else if (type === "postgres-container") {
      body.containerName = containerName
      body.user = user
      body.password = password
      body.database = database
    } else if (type === "container-volume") {
      body.containerName = cvContainerName
      body.volumePath = volumePath
      const patterns = include.split("\n").map((s) => s.trim()).filter(Boolean)
      if (patterns.length) body.include = patterns
    }

    try {
      await createMutation.mutateAsync(body)
      navigate("/sources")
    } catch {
      alert(t("sources.createError"))
    }
  }

  const renderPostgresFields = () => {
    return (
      <>
        {isContainer ? (
          <div className="space-y-2">
            <Label htmlFor="containerName">{t("sources.containerName")}</Label>
            <Select
              value={containerName}
              onChange={(e) => { setContainerName(e.target.value); }}
              disabled={dockerContainersLoading || !!dockerContainersError}
            >
              <option value="" disabled>{dockerContainersLoading ? t("common.loading") : dockerContainersError ? t("sources.containerFetchError") : t("sources.selectContainer")}</option>
              {dockerContainers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {containerName && !dockerContainers.includes(containerName) && (
                <option value={containerName}>{containerName}</option>
              )}
            </Select>
            {dockerContainersLoading && <p className="text-xs text-muted-foreground">{t("common.loading")}</p>}
            {dockerContainersError && <p className="text-xs text-muted-foreground">{dockerContainersError}</p>}
          </div>
        ) : (
          <>
            <div className="space-y-2"><Label htmlFor="host">{t("sources.host")}</Label><Input id="host" value={host} onChange={(e) => { setHost(e.target.value); }} placeholder={t("sources.hostPlaceholder")} /></div>
            <div className="space-y-2"><Label htmlFor="port">{t("sources.port")}</Label><Input id="port" type="number" value={port} onChange={(e) => { setPort(Number(e.target.value)); }} placeholder={t("sources.portPlaceholder")} /></div>
          </>
        )}

        <div className="space-y-2"><Label htmlFor="user">{t("sources.user")}</Label><Input id="user" value={user} onChange={(e) => { setUser(e.target.value); }} /></div>
        <div className="space-y-2"><Label htmlFor="password">{t("sources.password")}</Label><Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); }} /></div>

        <div className="space-y-2">
          <Label htmlFor="database">{t("sources.database")}</Label>

          <Select
            value={database}
            onChange={(e) => { setDatabase(e.target.value); }}
            disabled={!fieldsReady || databasesLoading || databasesError !== ""}
          >
            <option value="" disabled>{databasesLoading ? t("common.loading") : databasesError ? t("sources.noDatabases") : t("sources.selectDatabase")}</option>
            {databases.map((db) => (
              <option key={db} value={db}>{db}</option>
            ))}
            {database && !databases.includes(database) && (
              <option value={database}>{database}</option>
            )}
          </Select>

          {databasesLoading && <p className="text-xs text-muted-foreground">{t("sources.fetchingDatabases")}</p>}
          {databasesError && <p className="text-xs text-muted-foreground">{databasesError}</p>}
        </div>
      </>
    )
  }

  const renderContainerVolumeFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="cvContainerName">{t("sources.containerName")}</Label>
        <Select
          value={cvContainerName}
          onChange={(e) => { setCvContainerName(e.target.value); }}
          disabled={dockerContainersLoading || !!dockerContainersError}
        >
          <option value="" disabled>{dockerContainersLoading ? t("common.loading") : dockerContainersError ? t("sources.containerFetchError") : t("sources.selectContainer")}</option>
          {dockerContainers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        {dockerContainersLoading && <p className="text-xs text-muted-foreground">{t("common.loading")}</p>}
        {dockerContainersError && <p className="text-xs text-muted-foreground">{dockerContainersError}</p>}
      </div>

      {cvContainerName && (
        <div className="space-y-2">
          <Label htmlFor="volumePath">{t("sources.volumePath")}</Label>
          <Select
            value={volumePath}
            onChange={(e) => { setVolumePath(e.target.value); }}
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

      {volumePath && (
        <div className="space-y-2">
          <Label htmlFor="include">{t("sources.includePatterns")}</Label>
          <textarea
            id="include"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={include}
            onChange={(e) => { setInclude(e.target.value); }}
            placeholder={t("sources.includePatternsPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("sources.includePatternsHint")}</p>
        </div>
      )}
    </>
  )

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("sources.addSource")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("sources.addSource")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("sources.sourceType")}</Label>
              <Select value={type} onChange={(e) => { setType(e.target.value); }}>
                <option value="path">Path</option>
                <option value="postgres">PostgreSQL</option>
                <option value="postgres-container">PostgreSQL Container</option>
                <option value="container-volume">Container Volume</option>
              </Select>
            </div>

            {type === "path" && (
              <div className="space-y-2">
                <Label htmlFor="path">{t("sources.path")}</Label>
                <Input id="path" value={path} onChange={(e) => { setPath(e.target.value); }} placeholder={t("sources.pathPlaceholder")} />
              </div>
            )}

            {isPostgres && renderPostgresFields()}

            {type === "container-volume" && renderContainerVolumeFields()}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createMutation.isPending || !canCreate}>
                {createMutation.isPending ? t("common.loading") : t("common.create")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { navigate("/sources"); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
