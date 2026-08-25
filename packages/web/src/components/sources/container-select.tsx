import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import type { ContainerSelectProps } from "@/types/ui-fields"
import * as styles from "./container-select.styles"

const ContainerSelect = ({ props }: { props: ContainerSelectProps }) => {
  const { t } = useTranslation()

  return (
    <div className={styles.fieldGroup}>
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select
        id={props.id}
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value)
        }}
        disabled={props.loading || !!props.error}
      >
        <option value="" disabled>
          {props.loading
            ? t("common.loading")
            : props.error
              ? t("sources.containerFetchError")
              : t("sources.selectContainer")}
        </option>
        {props.containers.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        {props.allowCustomValue && props.value && !props.containers.includes(props.value) && (
          <option value={props.value}>{props.value}</option>
        )}
      </Select>
      {props.loading && <p className={styles.hint}>{t("common.loading")}</p>}
      {props.error && <p className={styles.hint}>{props.error}</p>}
    </div>
  )
}

export { ContainerSelect }
