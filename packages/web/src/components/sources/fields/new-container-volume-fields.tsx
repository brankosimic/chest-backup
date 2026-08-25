import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useNewSourceForm } from "@/hooks/use-new-source"
import { ContainerSelect } from "../container-select"
import * as styles from "./new-container-volume-fields.styles"

const NewContainerVolumeFields = () => {
  const { t } = useTranslation()
  const form = useNewSourceForm()

  return (
    <>
      <ContainerSelect
        props={{
          id: "cvContainerName",
          label: t("sources.containerName"),
          value: form.cvContainerName,
          onChange: form.setCvContainerName,
          containers: form.dockerContainers,
          loading: form.dockerContainersLoading,
          error: form.dockerContainersError,
        }}
      />

      {form.cvContainerName && (
        <div className={styles.fieldGroup}>
          <Label htmlFor="volumePath">{t("sources.volumePath")}</Label>
          <Select
            id="volumePath"
            value={form.volumePath}
            onChange={(e) => {
              form.setVolumePath(e.target.value)
            }}
            disabled={!!form.cvVolumesError}
          >
            <option value="" disabled>
              {form.cvVolumesError ? t("sources.noVolumes") : t("sources.selectVolumePath")}
            </option>
            {form.cvVolumes.map((v, i) => (
              <option key={`${v.source}-${String(i)}`} value={v.source}>
                {v.destination} → {v.source}
                {v.name ? ` (${v.name})` : ""}
              </option>
            ))}
          </Select>
          {form.cvVolumesError && <p className={styles.hint}>{form.cvVolumesError}</p>}
        </div>
      )}

      {form.volumePath && (
        <div className={styles.fieldGroup}>
          <Label htmlFor="include">{t("sources.includePatterns")}</Label>
          <textarea
            id="include"
            className={styles.textarea}
            value={form.include}
            onChange={(e) => {
              form.setInclude(e.target.value)
            }}
            placeholder={t("sources.includePatternsPlaceholder")}
          />
          <p className={styles.hint}>{t("sources.includePatternsHint")}</p>
        </div>
      )}
    </>
  )
}

export { NewContainerVolumeFields }
