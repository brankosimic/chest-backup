import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useNewSourceForm } from "@/hooks/use-new-source"
import { ContainerSelect } from "../container-select"
import * as styles from "./new-postgres-fields.styles"

const NewPostgresFields = () => {
  const { t } = useTranslation()
  const form = useNewSourceForm()

  return (
    <>
      {form.isContainer ? (
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
      ) : (
        <>
          <div className={styles.fieldGroup}>
            <Label htmlFor="host">{t("sources.host")}</Label>
            <Input
              id="host"
              value={form.host}
              onChange={(e) => {
                form.setHost(e.target.value)
              }}
              placeholder={t("sources.hostPlaceholder")}
            />
          </div>
          <div className={styles.fieldGroup}>
            <Label htmlFor="port">{t("sources.port")}</Label>
            <Input
              id="port"
              type="number"
              value={form.port}
              onChange={(e) => {
                form.setPort(Number(e.target.value))
              }}
              placeholder={t("sources.portPlaceholder")}
            />
          </div>
        </>
      )}

      <div className={styles.fieldGroup}>
        <Label htmlFor="user">{t("sources.user")}</Label>
        <Input
          id="user"
          value={form.user}
          onChange={(e) => {
            form.setUser(e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label htmlFor="password">{t("sources.password")}</Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => {
            form.setPassword(e.target.value)
          }}
        />
      </div>

      <div className={styles.fieldGroup}>
        <Label htmlFor="database">{t("sources.database")}</Label>

        <Select
          id="database"
          value={form.database}
          onChange={(e) => {
            form.setDatabase(e.target.value)
          }}
          disabled={!form.fieldsReady || form.databasesLoading || form.databasesError !== ""}
        >
          <option value="" disabled>
            {form.databasesLoading
              ? t("common.loading")
              : form.databasesError
                ? t("sources.noDatabases")
                : t("sources.selectDatabase")}
          </option>
          {form.databases.map((db) => (
            <option key={db} value={db}>
              {db}
            </option>
          ))}
          {form.database && !form.databases.includes(form.database) && (
            <option value={form.database}>{form.database}</option>
          )}
        </Select>

        {form.databasesLoading && <p className={styles.hint}>{t("sources.fetchingDatabases")}</p>}
        {form.databasesError && <p className={styles.hint}>{form.databasesError}</p>}
      </div>
    </>
  )
}

export { NewPostgresFields }
