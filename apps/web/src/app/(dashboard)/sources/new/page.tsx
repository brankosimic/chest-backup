import { useTranslation } from "react-i18next"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { useCreateSource } from "@/hooks/use-queries"
import type { FormEvent } from "react"

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

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
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

            {type === "postgres" && (
              <>
                <div className="space-y-2"><Label htmlFor="host">{t("sources.host")}</Label><Input id="host" value={host} onChange={(e) => { setHost(e.target.value); }} placeholder={t("sources.hostPlaceholder")} /></div>
                <div className="space-y-2"><Label htmlFor="port">{t("sources.port")}</Label><Input id="port" type="number" value={port} onChange={(e) => { setPort(Number(e.target.value)); }} placeholder={t("sources.portPlaceholder")} /></div>
                <div className="space-y-2"><Label htmlFor="user">{t("sources.user")}</Label><Input id="user" value={user} onChange={(e) => { setUser(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="password">{t("sources.password")}</Label><Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="database">{t("sources.database")}</Label><Input id="database" value={database} onChange={(e) => { setDatabase(e.target.value); }} /></div>
              </>
            )}

            {type === "postgres-container" && (
              <>
                <div className="space-y-2"><Label htmlFor="containerName">{t("sources.containerName")}</Label><Input id="containerName" value={containerName} onChange={(e) => { setContainerName(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="user">{t("sources.user")}</Label><Input id="user" value={user} onChange={(e) => { setUser(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="password">{t("sources.password")}</Label><Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="database">{t("sources.database")}</Label><Input id="database" value={database} onChange={(e) => { setDatabase(e.target.value); }} /></div>
              </>
            )}

            {type === "docker-compose" && (
              <>
                <div className="space-y-2"><Label htmlFor="name">{t("sources.name")}</Label><Input id="name" value={name} onChange={(e) => { setName(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="path">{t("sources.path")}</Label><Input id="path" value={path} onChange={(e) => { setPath(e.target.value); }} placeholder={t("sources.dockerComposePath")} /></div>
                <div className="space-y-2"><Label htmlFor="containers">{t("sources.containers")}</Label><Input id="containers" value={containers} onChange={(e) => { setContainers(e.target.value); }} placeholder={t("sources.containersPlaceholder")} /></div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
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
