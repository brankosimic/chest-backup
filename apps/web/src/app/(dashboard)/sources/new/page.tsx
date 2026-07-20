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
import { testPostgresSource, fetchPostgresDatabases } from "@/lib/api-client"
import type { SubmitEvent } from "react"

type TestResult = "idle" | "pending" | "success" | "error" | "passed"
type PgType = "postgres" | "postgres-container"

export default function NewSourcePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateSource()
  const [type, setType] = useState("path")
  const [path, setPath] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState(5432)
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [database, setDatabase] = useState("")
  const [containerName, setContainerName] = useState("")
  const [name, setName] = useState("")
  const [containers, setContainers] = useState("")

  const [testResult, setTestResult] = useState<TestResult>("idle")
  const [testMessage, setTestMessage] = useState("")
  const [databases, setDatabases] = useState<string[]>([])
  const [databasesLoading, setDatabasesLoading] = useState(false)
  const [databasesError, setDatabasesError] = useState("")

  const isPostgres = type === "postgres" || type === "postgres-container"
  const canCreate = isPostgres
    ? testResult === "passed"
    : true

  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (res.length > 0) {
        setDatabases(res)
      } else {
        setDatabases([])
        setDatabasesError("No databases found")
      }
    } catch {
      setDatabasesError("Failed to fetch databases")
    } finally {
      setDatabasesLoading(false)
    }
  }, [type, host, port, user, password, containerName])

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    if (!isPostgres || !user || !password) return
    fetchTimerRef.current = setTimeout(fetchDbList, 600)
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [fetchDbList, isPostgres, user, password])

  useEffect(() => {
    setDatabase("")
    setDatabases([])
    setDatabasesError("")
    setTestResult("idle")
    setTestMessage("")
  }, [type])

  const handleTest = async () => {
    setTestResult("pending")
    setTestMessage("")
    try {
      const res = await testPostgresSource({
        type: type as PgType,
        host: type === "postgres" ? host : undefined,
        port: type === "postgres" ? port : undefined,
        user,
        password,
        containerName: type === "postgres-container" ? containerName : undefined,
      })
      if (res.success) {
        setTestResult("passed")
        setTestMessage(res.message ?? "Connection successful")
      } else {
        setTestResult("error")
        setTestMessage(res.message ?? "Connection failed")
      }
    } catch {
      setTestResult("error")
      setTestMessage("Test request failed")
    }
  }

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
    } else if (type === "docker-compose") {
      body.name = name
      body.path = path
      body.containers = containers.split(",").map((c) => c.trim())
    }

    try {
      await createMutation.mutateAsync(body)
      navigate("/sources")
    } catch {
      alert("Failed to create source")
    }
  }

  const renderPostgresFields = () => {
    const isContainer = type === "postgres-container"

    return (
      <>
        {isContainer ? (
          <div className="space-y-2"><Label htmlFor="containerName">{t("sources.containerName")}</Label><Input id="containerName" value={containerName} onChange={(e) => { setContainerName(e.target.value); }} /></div>
        ) : (
          <>
            <div className="space-y-2"><Label htmlFor="host">{t("sources.host")}</Label><Input id="host" value={host} onChange={(e) => { setHost(e.target.value); }} placeholder={t("sources.hostPlaceholder")} /></div>
            <div className="space-y-2"><Label htmlFor="port">{t("sources.port")}</Label><Input id="port" type="number" value={port} onChange={(e) => { setPort(Number(e.target.value)); }} placeholder={t("sources.portPlaceholder")} /></div>
          </>
        )}

        <div className="space-y-2"><Label htmlFor="user">{t("sources.user")}</Label><Input id="user" value={user} onChange={(e) => { setUser(e.target.value); }} /></div>
        <div className="space-y-2"><Label htmlFor="password">{t("sources.password")}</Label><Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); }} /></div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="database">{t("sources.database")}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleTest()}
              disabled={testResult === "pending" || !user || !password || (isContainer ? !containerName : !host)}
            >
              {testResult === "pending" ? t("common.loading") : t("sources.testConnection")}
            </Button>
          </div>

          {testResult === "pending" && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          {testResult === "success" && <p className="text-sm text-green-600">{testMessage}</p>}
          {testResult === "error" && <p className="text-sm text-red-600">{testMessage}</p>}

          <Select
            value={database}
            onChange={(e) => { setDatabase(e.target.value); }}
            disabled={databasesLoading || databasesError !== ""}
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
                <option value="docker-compose">Docker Compose</option>
              </Select>
            </div>

            {type === "path" && (
              <div className="space-y-2">
                <Label htmlFor="path">{t("sources.path")}</Label>
                <Input id="path" value={path} onChange={(e) => { setPath(e.target.value); }} placeholder={t("sources.pathPlaceholder")} />
              </div>
            )}

            {isPostgres && renderPostgresFields()}

            {type === "docker-compose" && (
              <>
                <div className="space-y-2"><Label htmlFor="name">{t("sources.name")}</Label><Input id="name" value={name} onChange={(e) => { setName(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="path">{t("sources.path")}</Label><Input id="path" value={path} onChange={(e) => { setPath(e.target.value); }} placeholder={t("sources.dockerComposePath")} /></div>
                <div className="space-y-2"><Label htmlFor="containers">{t("sources.containers")}</Label><Input id="containers" value={containers} onChange={(e) => { setContainers(e.target.value); }} placeholder={t("sources.containersPlaceholder")} /></div>
              </>
            )}

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
