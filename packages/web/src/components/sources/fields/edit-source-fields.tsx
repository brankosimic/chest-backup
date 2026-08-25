import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import { PostgresFields } from "./postgres-fields"
import { ContainerVolumeFields } from "./container-volume-fields"
import { SqliteFields, SqliteContainerFields } from "./sqlite-fields"
import type { EditSourceFieldsProps } from "@/types/ui-fields"
import { SourceType } from "@/lib/sources"
import * as styles from "./edit-source-fields.styles"

const EditSourceFields = ({ props }: { props: EditSourceFieldsProps }) => {
  const { t } = useTranslation()

  switch (props.type) {
    case SourceType.Path:
      return (
        <div className={styles.fieldGroup}>
          <Label>{t("sources.path")}</Label>
          <Input
            value={props.form.path as string}
            onChange={(e) => {
              props.update("path", e.target.value)
            }}
            placeholder={t("sources.pathPlaceholderEdit")}
          />
        </div>
      )
    case SourceType.Postgres:
      return <PostgresFields props={{ form: props.form, update: props.update, isContainer: false }} />
    case SourceType.PostgresContainer:
      return <PostgresFields props={{ form: props.form, update: props.update, isContainer: true }} />
    case SourceType.ContainerVolume:
      return (
        <ContainerVolumeFields
          props={{
            form: props.form,
            update: props.update,
            containers: props.containers,
            containersLoading: props.containersLoading,
            containersError: props.containersError,
            volumes: props.volumes,
            volumesError: props.volumesError,
          }}
        />
      )
    case SourceType.Sqlite:
      return (
        <SqliteFields
          props={{
            form: props.form,
            update: props.update,
            containers: props.containers,
            containersLoading: props.containersLoading,
            containersError: props.containersError,
          }}
        />
      )
    case SourceType.SqliteContainer:
      return (
        <SqliteContainerFields
          props={{
            form: props.form,
            update: props.update,
            containers: props.containers,
            containersLoading: props.containersLoading,
            containersError: props.containersError,
          }}
        />
      )
    default:
      return null
  }
}

export { EditSourceFields }
