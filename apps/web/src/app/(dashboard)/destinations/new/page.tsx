"use client"

import { useTranslation } from "react-i18next"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/layout/header"
import { useCreateDestination } from "@/hooks/use-queries"
import type { FormEvent } from "react"

export default function NewDestinationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateDestination()
  const [type, setType] = useState("local")
  const [name, setName] = useState("")
  const [path, setPath] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState(22)
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [retention, setRetention] = useState<number | undefined>(undefined)
  const [parallel, setParallel] = useState(false)
  const [timeout, setTimeout_] = useState<number | undefined>(undefined)
  const [skip, setSkip] = useState(false)

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const body: Record<string, unknown> = { type, name: name || undefined, path }

    if (type === "sftp") {
      body.host = host
      body.port = port
      body.user = user
      body.password = password
      body.privateKey = privateKey
      if (timeout !== undefined) body.timeout = timeout
    }

    if (retention !== undefined) body.retention = retention
    body.parallel = parallel
    body.skip = skip

    try {
      await createMutation.mutateAsync(body)
      navigate("/destinations")
    } catch {
      alert("Failed to create destination")
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("destinations.addDestination")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("destinations.newDestination")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("destinations.destinationType")}</Label>
              <Select value={type} onChange={(e) => { setType(e.target.value); }}>
                <option value="local">Local</option>
                <option value="sftp">SFTP</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("destinations.name")}</Label>
              <Input id="name" value={name} onChange={(e) => { setName(e.target.value); }} placeholder="My Server" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">{t("destinations.local")} Path</Label>
              <Input id="path" value={path} onChange={(e) => { setPath(e.target.value); }} placeholder={t("destinations.pathPlaceholder")} />
            </div>

            {type === "sftp" && (
              <>
                <div className="space-y-2"><Label htmlFor="host">{t("destinations.sftpHost")}</Label><Input id="host" value={host} onChange={(e) => { setHost(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="port">{t("destinations.sftpPort")}</Label><Input id="port" type="number" value={port} onChange={(e) => { setPort(Number(e.target.value)); }} /></div>
                <div className="space-y-2"><Label htmlFor="user">{t("destinations.sftpUser")}</Label><Input id="user" value={user} onChange={(e) => { setUser(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="password">{t("destinations.sftpPassword")}</Label><Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="privateKey">{t("destinations.privateKey")}</Label><Input id="privateKey" value={privateKey} onChange={(e) => { setPrivateKey(e.target.value); }} /></div>
                <div className="space-y-2"><Label htmlFor="timeout">{t("destinations.timeout")}</Label><Input id="timeout" type="number" value={timeout ?? ""} onChange={(e) => { setTimeout_(e.target.value ? Number(e.target.value) : undefined); }} /></div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="retention">{t("destinations.retention")}</Label>
              <Input id="retention" type="number" value={retention ?? ""} onChange={(e) => { setRetention(e.target.value ? Number(e.target.value) : undefined); }} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">{t("destinations.parallel")}</span>
              <Switch checked={parallel} onCheckedChange={setParallel} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">{t("destinations.skip")}</span>
              <Switch checked={skip} onCheckedChange={setSkip} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.loading") : t("common.create")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { navigate("/destinations"); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
