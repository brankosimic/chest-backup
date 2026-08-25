import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import type { ContainerVolumeFieldsProps } from "@/types/ui-fields"
import { ContainerSelect } from "../container-select"
import * as styles from "./container-volume-fields.styles"

const ContainerVolumeFields = ({ props }: { props: ContainerVolumeFieldsProps }) => {
  const { t } = useTranslation()
  const containerName = props.form.containerName as string
  const volumePath = props.form.volumePath as string
  const include = props.form.include as string

  return (
    <>
      <ContainerSelect
        props={{
          label: t("sources.containerName"),
          value: containerName,
          onChange: (v) => {
            props.update("containerName", v)
            props.update("volumePath", "")
          },
          containers: props.containers,
          loading: props.containersLoading,
          error: props.containersError,
          allowCustomValue: true,
        }}
      />

      {containerName && (
        <div className={styles.fieldGroup}>
          <Label>{t("sources.volumePath")}</Label>
          <Select
            value={volumePath}
            onChange={(e) => {
              props.update("volumePath", e.target.value)
            }}
            disabled={!!props.volumesError}
          >
            <option value="" disabled>
              {props.volumesError ? t("sources.noVolumes") : t("sources.selectVolumePath")}
            </option>
            {props.volumes.map((v, i) => (
              <option key={`${v.source}-${String(i)}`} value={v.source}>
                {v.destination} → {v.source}
                {v.name ? ` (${v.name})` : ""}
              </option>
            ))}
          </Select>
          {props.volumesError && <p className={styles.hint}>{props.volumesError}</p>}
        </div>
      )}

      {volumePath && (
        <div className={styles.fieldGroup}>
          <Label>{t("sources.includePatterns")}</Label>
          <textarea
            className={styles.textarea}
            value={include}
            onChange={(e) => {
              props.update("include", e.target.value)
            }}
            placeholder={t("sources.includePatternsExample")}
          />
          <p className={styles.hint}>{t("sources.includePatternsHint")}</p>
        </div>
      )}
    </>
  )
}

export { ContainerVolumeFields }
