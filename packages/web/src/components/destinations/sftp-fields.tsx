import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import type { SftpFieldsProps } from "@/types/ui-fields"
import * as styles from "./sftp-fields.styles"

const SftpFields = ({ props }: { props: SftpFieldsProps }) => {
  const { t } = useTranslation()

  return (
    <>
      <div className={styles.fieldGroup}>
        <Label>{props.labels.host}</Label>
        <Input
          value={props.host}
          onChange={(e) => {
            props.onHostChange(e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{props.labels.port}</Label>
        <Input
          type="number"
          value={props.port}
          onChange={(e) => {
            props.onPortChange(Number(e.target.value))
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{props.labels.user}</Label>
        <Input
          value={props.user}
          onChange={(e) => {
            props.onUserChange(e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{props.labels.password}</Label>
        <Input
          type="password"
          value={props.password}
          onChange={(e) => {
            props.onPasswordChange(e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{t("destinations.privateKey")}</Label>
        <Input
          value={props.privateKey}
          onChange={(e) => {
            props.onPrivateKeyChange(e.target.value)
          }}
        />
      </div>
      <div className={styles.fieldGroup}>
        <Label>{t("destinations.timeout")}</Label>
        <Input
          type="number"
          value={props.timeout ?? ""}
          onChange={(e) => {
            props.onTimeoutChange(e.target.value ? Number(e.target.value) : undefined)
          }}
        />
      </div>
    </>
  )
}

export { SftpFields }
