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
import { useDestination, useUpdateDestination } from "@/hooks/use-queries"
import * as styles from "./page.styles"

const DestinationEditPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() as { id: string }

  const { data: dest, isLoading } = useDestination(id)
  const updateMutation = useUpdateDestination()
  const [form, setForm] = useState<Record<string, unknown>>({})

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
    return (
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!dest) return null

  const type = form.type as string

  return (
    <div className={styles.page}>
      <Header title={t("destinations.editDestination")} subtitle={`Type: ${type}`} />

      <Card>
        <CardHeader>
          <CardTitle>{t("destinations.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className={styles.fieldGroup}>
          <div className={styles.fieldGroup}>
            <Label>{t("destinations.destinationType")}</Label>
            <Select
              value={type}
              onChange={(e) => { setForm({ ...form, type: e.target.value }); }}
            >
              <option value={"local"}>{t("destinations.local")}</option>
              <option value={"sftp"}>{t("destinations.sftp")}</option>
            </Select>
          </div>

          <div className={styles.fieldGroup}>
            <Label>{t("destinations.name")}</Label>
            <Input
              value={form.name as string}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); }}
              placeholder={t("destinations.namePlaceholder")}
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label>{t("destinations.path")}</Label>
            <Input
              value={form.path as string}
              onChange={(e) => { setForm({ ...form, path: e.target.value }); }}
            />
          </div>

          {type === "sftp" && (
            <SftpFields
              props={{
                host: form.host as string,
                port: form.port as number,
                user: form.user as string,
                password: form.password as string,
                privateKey: form.privateKey as string,
                timeout: form.timeout as number | undefined,
                onHostChange: (v) => { setForm({ ...form, host: v }); },
                onPortChange: (v) => { setForm({ ...form, port: v }); },
                onUserChange: (v) => { setForm({ ...form, user: v }); },
                onPasswordChange: (v) => { setForm({ ...form, password: v }); },
                onPrivateKeyChange: (v) => { setForm({ ...form, privateKey: v }); },
                onTimeoutChange: (v) => { setForm({ ...form, timeout: v }); },
                labels: {
                  host: t("destinations.host"),
                  port: t("destinations.port"),
                  user: t("destinations.user"),
                  password: t("destinations.password"),
                },
              }}
            />
          )}

          <div className={styles.fieldGroup}>
            <Label>{t("destinations.retention")}</Label>
            <Input
              type="number"
              value={form.retention as number}
              onChange={(e) => { setForm({ ...form, retention: Number(e.target.value) }); }}
            />
          </div>

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>{t("destinations.parallel")}</span>
            <Switch
              checked={form.parallel as boolean}
              onCheckedChange={(v) => { setForm({ ...form, parallel: v }); }}
            />
          </div>

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>{t("destinations.skip")}</span>
            <Switch
              checked={form.skip as boolean}
              onCheckedChange={(v) => { setForm({ ...form, skip: v }); }}
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
