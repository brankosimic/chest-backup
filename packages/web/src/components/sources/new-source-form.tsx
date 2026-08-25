import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useNewSourceForm } from "@/hooks/use-new-source"
import { SourceType } from "@/lib/sources"
import { NewPostgresFields } from "./fields/new-postgres-fields"
import { NewContainerVolumeFields } from "./fields/new-container-volume-fields"
import { ContainerSelect } from "./container-select"
import * as styles from "./new-source-form.styles"

const NewSourceForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const form = useNewSourceForm()

  return (
    <form onSubmit={form.handleCreate} className={styles.form}>
      <div className={styles.fieldGroup}>
        <Label>{t("sources.sourceType")}</Label>
        <Select
          value={form.type}
          onChange={(e) => {
            form.setType(e.target.value)
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

      {form.type === SourceType.Path && (
        <div className={styles.fieldGroup}>
          <Label htmlFor="path">{t("sources.path")}</Label>
          <Input
            id="path"
            value={form.path}
            onChange={(e) => {
              form.setPath(e.target.value)
            }}
            placeholder={t("sources.pathPlaceholder")}
          />
        </div>
      )}

      {form.isPostgres && <NewPostgresFields />}

      {form.type === SourceType.ContainerVolume && <NewContainerVolumeFields />}

      {form.type === SourceType.Sqlite && (
        <div className={styles.fieldGroup}>
          <Label htmlFor="path">{t("sources.path")}</Label>
          <Input
            id="path"
            value={form.path}
            onChange={(e) => {
              form.setPath(e.target.value)
            }}
            placeholder={t("sources.sqlitePathPlaceholder")}
          />
        </div>
      )}

      {form.type === SourceType.SqliteContainer && (
        <>
          <ContainerSelect
            props={{
              id: "containerName",
              label: t("sources.containerName"),
              value: form.containerName,
              onChange: form.setContainerName,
              containers: form.dockerContainers,
              loading: form.dockerContainersLoading,
              error: form.dockerContainersError,
              allowCustomValue: true,
            }}
          />
          <div className={styles.fieldGroup}>
            <Label htmlFor="dbPath">{t("sources.databasePath")}</Label>
            <Input
              id="dbPath"
              value={form.dbPath}
              onChange={(e) => {
                form.setDbPath(e.target.value)
              }}
              placeholder={t("sources.dbPathPlaceholder")}
            />
          </div>
        </>
      )}

      <div className={styles.actions}>
        <Button type="submit" disabled={form.createPending || !form.canCreate}>
          {form.createPending ? t("common.loading") : t("common.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void navigate("/sources")
          }}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  )
}

export { NewSourceForm }
