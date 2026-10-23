import { useTranslation } from "react-i18next"
import { RunStatus as RunStatusEnum, RunTrigger as RunTriggerEnum } from "@chest-backup/shared"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toRunSort, toRunStatus, toRunTrigger, toTimeRange } from "@/lib/enums"
import { Search, X } from "lucide-react"
import { TimeRange } from "@/types/activity"
import { RunSort } from "@/types/api"
import type { ActivityFiltersProps } from "@/types/activity"
import * as styles from "./activity-filters.styles"

const ActivityFilters = ({ value, onChange, destinations }: ActivityFiltersProps) => {
  const { t } = useTranslation()

  const set = <K extends keyof ActivityFiltersProps["value"]>(
    key: K,
    next: ActivityFiltersProps["value"][K],
  ): void => {
    onChange({ ...value, [key]: next })
  }

  const hasFilters =
    value.search !== "" ||
    value.status !== null ||
    value.trigger !== null ||
    value.destinationId !== null ||
    value.range !== TimeRange.All

  const resetFilters = (): void => {
    onChange({
      search: "",
      status: null,
      trigger: null,
      destinationId: null,
      range: TimeRange.All,
      sort: RunSort.Newest,
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.search}>
        <Search className={styles.searchIcon} />
        <Input
          value={value.search}
          onChange={(event) => {
            set("search", event.target.value)
          }}
          placeholder={t("activity.filters.search")}
          className="pl-8"
        />
      </div>

      <Select
        value={value.status ?? ""}
        onChange={(event) => {
          set("status", toRunStatus(event.target.value))
        }}
        className={styles.select}
      >
        <option value="">{t("activity.filters.allStatuses")}</option>
        <option value={RunStatusEnum.Success}>{t("status.success")}</option>
        <option value={RunStatusEnum.Partial}>{t("status.partial")}</option>
        <option value={RunStatusEnum.Failed}>{t("status.failed")}</option>
        <option value={RunStatusEnum.Skipped}>{t("status.skipped")}</option>
      </Select>

      <Select
        value={value.trigger ?? ""}
        onChange={(event) => {
          set("trigger", toRunTrigger(event.target.value))
        }}
        className={styles.selectNarrow}
      >
        <option value="">{t("activity.filters.allTriggers")}</option>
        <option value={RunTriggerEnum.Scheduled}>{t("activity.trigger.scheduled")}</option>
        <option value={RunTriggerEnum.Manual}>{t("activity.trigger.manual")}</option>
      </Select>

      <Select
        value={value.destinationId ?? ""}
        onChange={(event) => {
          set("destinationId", event.target.value || null)
        }}
        className={styles.select}
      >
        <option value="">{t("activity.filters.allDestinations")}</option>
        {destinations.map((destination) => (
          <option key={destination.id} value={destination.id}>
            {destination.name ?? destination.path}
          </option>
        ))}
      </Select>

      <Select
        value={value.range}
        onChange={(event) => {
          set("range", toTimeRange(event.target.value))
        }}
        className={styles.selectNarrow}
      >
        <option value={TimeRange.All}>{t("activity.filters.allTime")}</option>
        <option value={TimeRange.Day}>{t("activity.filters.last24h")}</option>
        <option value={TimeRange.Week}>{t("activity.filters.last7d")}</option>
        <option value={TimeRange.Month}>{t("activity.filters.last30d")}</option>
        <option value={TimeRange.Quarter}>{t("activity.filters.last90d")}</option>
      </Select>

      <Select
        value={value.sort}
        onChange={(event) => {
          set("sort", toRunSort(event.target.value))
        }}
        className={styles.selectNarrow}
      >
        <option value={RunSort.Newest}>{t("activity.filters.sortNewest")}</option>
        <option value={RunSort.Oldest}>{t("activity.filters.sortOldest")}</option>
        <option value={RunSort.Duration}>{t("activity.filters.sortDuration")}</option>
        <option value={RunSort.Size}>{t("activity.filters.sortSize")}</option>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className={styles.reset}>
          <X className="h-3.5 w-3.5" />
          {t("activity.filters.reset")}
        </Button>
      )}
    </div>
  )
}

export { ActivityFilters }
