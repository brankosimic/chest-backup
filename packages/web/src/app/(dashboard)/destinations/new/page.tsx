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
import { SftpFields } from "@/components/destinations/sftp-fields"
import { useCreateDestination } from "@/hooks/use-queries"
import type { SyntheticEvent } from "react"
import * as styles from "./page.styles"

const NewDestinationPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateDestination()
  const [type, setType] = useState<string>("local")
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

  const buildBody = (): Record<string, unknown> => {
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

    return body
  }

  const handleCreate = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    createMutation
      .mutateAsync(buildBody())
      .then(() => {
        void navigate("/destinations")
      })
      .catch(() => {
        alert(t("common.saveError"))
      })
  }

  return (
    <div className={styles.page}>
      <Header title={t("destinations.addDestination")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("destinations.newDestination")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className={styles.fieldGroup}>
            <div className={styles.fieldGroup}>
              <Label>{t("destinations.destinationType")}</Label>
              <Select
                value={type}
                onChange={(e) => { setType(e.target.value); }}
              >
                <option value={"local"}>{t("destinations.local")}</option>
                <option value={"sftp"}>{t("destinations.sftp")}</option>
              </Select>
            </div>

            <div className={styles.fieldGroup}>
              <Label htmlFor="name">{t("destinations.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                placeholder={t("destinations.namePlaceholder")}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label htmlFor="path">{t("destinations.path")}</Label>
              <Input
                id="path"
                value={path}
                onChange={(e) => { setPath(e.target.value); }}
                placeholder={t("destinations.pathPlaceholder")}
              />
            </div>

            {type === "sftp" && (
              <SftpFields
                props={{
                  host,
                  port,
                  user,
                  password,
                  privateKey,
                  timeout,
                  onHostChange: setHost,
                  onPortChange: setPort,
                  onUserChange: setUser,
                  onPasswordChange: setPassword,
                  onPrivateKeyChange: setPrivateKey,
                  onTimeoutChange: setTimeout_,
                  labels: {
                    host: t("destinations.sftpHost"),
                    port: t("destinations.sftpPort"),
                    user: t("destinations.sftpUser"),
                    password: t("destinations.sftpPassword"),
                  },
                }}
              />
            )}

            <div className={styles.fieldGroup}>
              <Label htmlFor="retention">{t("destinations.retention")}</Label>
              <Input
                id="retention"
                type="number"
                value={retention ?? ""}
                onChange={(e) => { setRetention(e.target.value ? Number(e.target.value) : undefined); }}
              />
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{t("destinations.parallel")}</span>
              <Switch checked={parallel} onCheckedChange={setParallel} />
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{t("destinations.skip")}</span>
              <Switch checked={skip} onCheckedChange={setSkip} />
            </div>

            <div className={styles.actions}>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.loading") : t("common.create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate("/destinations")}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default NewDestinationPage
