import { useTranslation } from "react-i18next"
import { cn, formatRelative } from "@/lib/utils"
import { resolveRunStatus } from "@/lib/run-status"
import { statusMeta } from "@/components/activity/run-status"
import type { HealthStripProps } from "@/types/backup"
import * as styles from "./health-strip.styles"

/**
 * At-a-glance reliability of the most recent runs: one dot per run, newest on the right.
 */
const HealthStrip = ({ runs, className }: HealthStripProps) => {
  const { t } = useTranslation()
  const visible = runs.slice(0, 20)

  if (!visible.length) return null

  return (
    <div className={cn(styles.dots, className)} title={t("dashboard.recentActivity")}>
      {visible
        .slice()
        .reverse()
        .map((run) => {
          const meta = statusMeta(resolveRunStatus(run))
          return (
            <span
              key={run.id}
              title={`${formatRelative(run.startedAt)} — ${t(meta.labelKey)}`}
              className={cn(styles.dot, meta.dot)}
            />
          )
        })}
    </div>
  )
}

export { HealthStrip }
