import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import type { SqliteFieldsProps } from "@/types/ui-fields"
import { ContainerSelect } from "../container-select"
import * as styles from "./sqlite-fields.styles"

const SqliteFields = ({ props }: { props: SqliteFieldsProps }) => {
  const { t } = useTranslation()
  return (
    <div className={styles.fieldGroup}>
      <Label>{t("sources.path")}</Label>
      <Input
        value={props.form.path as string}
        onChange={(e) => {
          props.update("path", e.target.value)
        }}
        placeholder={t("sources.sqlitePathPlaceholder")}
      />
    </div>
  )
}

const SqliteContainerFields = ({ props }: { props: SqliteFieldsProps }) => {
  const { t } = useTranslation()
  const containerName = props.form.containerName as string
  return (
    <>
      <ContainerSelect
        props={{
          label: t("sources.containerName"),
          value: containerName,
          onChange: (v) => {
            props.update("containerName", v)
          },
          containers: props.containers,
          loading: props.containersLoading,
          error: props.containersError,
          allowCustomValue: true,
        }}
      />
      <div className={styles.fieldGroup}>
        <Label>{t("sources.databasePath")}</Label>
        <Input
          value={props.form.dbPath as string}
          onChange={(e) => {
            props.update("dbPath", e.target.value)
          }}
          placeholder={t("sources.dbPathPlaceholder")}
        />
      </div>
    </>
  )
}

export { SqliteFields, SqliteContainerFields }
