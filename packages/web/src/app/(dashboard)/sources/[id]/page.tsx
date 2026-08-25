import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { EditSourceFields } from "@/components/sources/fields/edit-source-fields"
import { useSource, useUpdateSource } from "@/hooks/use-queries"
import { useDockerContainers } from "@/hooks/use-docker-containers"
import { useContainerVolumes } from "@/hooks/use-container-volumes"
import { getSourceTypeDefault, parseIncludePatterns, SourceType } from "@/lib/sources"
import type { SourceTypeValue } from "@/lib/sources"
import * as styles from "./page.styles"

const buildUpdateBody = (type: string, form: Record<string, unknown>): Record<string, unknown> => {
  const body: Record<string, unknown> = { type }

  switch (type) {
    case SourceType.Path:
      body.path = form.path
      break
    case SourceType.Postgres:
      body.host = form.host
      body.port = Number(form.port) || 5432
      body.user = form.user
      body.password = form.password
      body.database = form.database
      break
    case SourceType.PostgresContainer:
      body.containerName = form.containerName
      body.user = form.user
      body.password = form.password
      body.database = form.database
      break
    case SourceType.ContainerVolume: {
      body.containerName = form.containerName
      body.volumePath = form.volumePath
      const patterns = parseIncludePatterns(form.include as string)
      if (patterns.length) body.include = patterns
      break
    }
    case SourceType.Sqlite:
      body.path = form.path
      break
    case SourceType.SqliteContainer:
      body.containerName = form.containerName
      body.dbPath = form.dbPath
      break
  }

  return body
}

const SourceEditPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() as { id: string }

  const { data: source, isLoading } = useSource(id)
  const updateMutation = useUpdateSource()
  const [type, setType] = useState<SourceTypeValue>(SourceType.Path)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [isFormReady, setIsFormReady] = useState(false)

  const needsContainers =
    type === SourceType.PostgresContainer || type === SourceType.ContainerVolume || type === SourceType.SqliteContainer

  const docker = useDockerContainers(needsContainers)
  const cv = useContainerVolumes({ containerName: form.containerName as string, type })

  useEffect(() => {
    if (source) {
      setType(source.type)
      setForm(getSourceTypeDefault(source.type, source as unknown as Record<string, unknown>))
      setIsFormReady(true)
    }
  }, [source])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: buildUpdateBody(type, form) })
      void navigate("/sources")
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

  if (!source || !isFormReady) return null

  return (
    <div className={styles.page}>
      <Header title={t("sources.editSource")} subtitle={type} />

      <Card>
        <CardHeader>
          <CardTitle>{t("sources.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className={styles.fieldGroup}>
          <div className={styles.fieldGroup}>
            <Label>{t("sources.sourceType")}</Label>
            <Select
              value={type}
              onChange={(e) => {
                const nextType = e.target.value as SourceTypeValue
                setType(nextType)
                setForm(getSourceTypeDefault(nextType, {}))
              }}
            >
              <option value={SourceType.Path}>{t("sources.typePath")}</option>
              <option value={SourceType.Postgres}>{t("sources.typePostgres")}</option>
              <option value={SourceType.PostgresContainer}>{t("sources.typePostgresContainer")}</option>
              <option value={SourceType.ContainerVolume}>{t("sources.typeContainerVolume")}</option>
              <option value={SourceType.Sqlite}>{t("sources.typeSqlite")}</option>
              <option value={SourceType.SqliteContainer}>{t("sources.typeSqliteContainer")}</option>
            </Select>
          </div>

          <EditSourceFields
            props={{
              type,
              form,
              update: (key, value) => { setForm((prev) => ({ ...prev, [key]: value })); },
              containers: docker.containers,
              containersLoading: docker.loading,
              containersError: docker.error,
              volumes: cv.volumes,
              volumesError: cv.error,
            }}
          />

          <div className={styles.actions}>
            <Button
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              variant="outline"
              onClick={() => void navigate("/sources")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SourceEditPage
