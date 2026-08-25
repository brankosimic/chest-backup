import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import type { PostgresFieldsProps } from "@/types/ui-fields"
import * as styles from "./postgres-fields.styles"

const PostgresFields = ({ props }: { props: PostgresFieldsProps }) => {
  const { t } = useTranslation()

  if (props.isContainer) {
    return (
      <>
        <div className={styles.fieldGroup}>
          <Label>{t("sources.containerName")}</Label>
          <Input
            value={props.form.containerName as string}
            onChange={(e) => {
              props.update("containerName", e.target.value)
            }}
          />
        </div>
        <div className={styles.fieldGroup}>
          <Label>{t("sources.user")}</Label>
          <Input
            value={props.form.user as string}
            onChange={(e) => {
              props.update("user", e.target.value)
            }}
          />
        </div>
        <div className={styles.fieldGroup}>
          <Label>{t("sources.password")}</Label>
          <Input
            type="password"
            value={props.form.password as string}
            onChange={(e) => {
              props.update("password", e.target.value)
            }}
          />
        </div>
        <div className={styles.fieldGroup}>
          <Label>{t("sources.database")}</Label>
          <Input
            value={props.form.database as string}
            onChange={(e) => {
              props.update("database", e.target.value)
            }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div className={styles.fieldGroup}>
        <Label>{t("sources.host")}</Label>
        <Input
          value={props.form.host as string}
          onChange={(e) => {
            props.update("host", e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{t("sources.port")}</Label>
        <Input
          type="number"
          value={props.form.port as number}
          onChange={(e) => {
            props.update("port", Number(e.target.value))
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{t("sources.user")}</Label>
        <Input
          value={props.form.user as string}
          onChange={(e) => {
            props.update("user", e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{t("sources.password")}</Label>
        <Input
          type="password"
          value={props.form.password as string}
          onChange={(e) => {
            props.update("password", e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{t("sources.database")}</Label>
        <Input
          value={props.form.database as string}
          onChange={(e) => {
            props.update("database", e.target.value)
          }}
        />
      </div>
    </>
  )
}

export { PostgresFields }
