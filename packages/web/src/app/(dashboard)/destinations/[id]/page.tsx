import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/layout/header"
import { SftpFields } from "@/components/destinations/sftp-fields"
import { DestinationType } from "@chest-backup/shared"
import { useDestination, useUpdateDestination } from "@/hooks/queries/destinations"
import { toDestinationType } from "@/lib/enums"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import * as styles from "./page.styles"

const DestinationEditPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() as { id: string }

  const { data: dest, isLoading } = useDestination(id)
  const updateMutation = useUpdateDestination()
  const [form, setForm] = useState<Record<string, unknown>>({})

  const updateField = (key: string, value: unknown): void => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const sftpLabels = {
    host: t("destinations.host"),
    port: t("destinations.port"),
    user: t("destinations.user"),
    password: t("destinations.password"),
  }

  useEffect(() => {
    if (dest) setForm(dest as unknown as Record<string, unknown>)
  }, [dest])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: form })
      void navigate("/destinations")
    } catch {
      alert(t("common.saveError"))
    }
  }

  if (isLoading) {
    return <LoadingSpinner className="h-screen" />
  }

  if (!dest) return null

  const type = toDestinationType(typeof form.type === "string" ? form.type : "")

  return (
    <div className={styles.page}>
      <Header title={t("destinations.editDestination")} subtitle={`${t("destinations.typeLabel")}: ${type}`} />

      <Card>
        <CardHeader>
          <CardTitle>{t("destinations.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className={styles.fieldGroup}>
          <div className={styles.fieldGroup}>
            <Label>{t("destinations.destinationType")}</Label>
            <Select
              value={type}
              onChange={(e) => { updateField("type", e.target.value); }}
            >
              <option value={DestinationType.Local}>{t("destinations.local")}</option>
              <option value={DestinationType.Sftp}>{t("destinations.sftp")}</option>
            </Select>
          </div>

          <div className={styles.fieldGroup}>
            <Label>{t("destinations.name")}</Label>
            <Input
              value={form.name as string}
              onChange={(e) => { updateField("name", e.target.value); }}
              placeholder={t("destinations.namePlaceholder")}
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label>{t("destinations.path")}</Label>
            <Input
              value={form.path as string}
              onChange={(e) => { updateField("path", e.target.value); }}
            />
          </div>

          {type === DestinationType.Sftp && (
            <SftpFields
              props={{
                host: form.host as string,
                port: form.port as number,
                user: form.user as string,
                password: form.password as string,
                privateKey: form.privateKey as string,
                timeout: form.timeout as number | undefined,
                onHostChange: (v) => { updateField("host", v); },
                onPortChange: (v) => { updateField("port", v); },
                onUserChange: (v) => { updateField("user", v); },
                onPasswordChange: (v) => { updateField("password", v); },
                onPrivateKeyChange: (v) => { updateField("privateKey", v); },
                onTimeoutChange: (v) => { updateField("timeout", v); },
                labels: sftpLabels,
              }}
            />
          )}

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>{t("destinations.parallel")}</span>
              <Switch
                checked={form.parallel as boolean}
                onCheckedChange={(v) => { updateField("parallel", v); }}
              />
          </div>

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>{t("destinations.skip")}</span>
              <Switch
                checked={form.skip as boolean}
                onCheckedChange={(v) => { updateField("skip", v); }}
              />
          </div>

          <div className={styles.actions}>
            <Button
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              variant="outline"
              onClick={() => void navigate("/destinations")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DestinationEditPage
