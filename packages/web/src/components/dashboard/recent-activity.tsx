import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { RunStatusBadge, TriggerBadge } from "@/components/activity/run-status"
import { DestinationChip } from "@/components/activity/destination-chip"
import { formatDateTimeCompact, formatDuration, formatNumber, formatRelative, formatSize } from "@/lib/utils"
import { resolveRunStatus } from "@/lib/run-status"
import { Activity as ActivityIcon, ArrowRight } from "lucide-react"
import type { RecentActivityProps } from "@/types/backup"
import type { MobileRunItemProps } from "@/types/ui"
import * as styles from "./recent-activity.styles"

const MobileRunItem = ({ run }: MobileRunItemProps) => {
  const { t } = useTranslation()

  return (
    <Link to="/activity" className={styles.mobileRow}>
      <div className={styles.mobileHeader}>
        <RunStatusBadge status={resolveRunStatus(run)} />
        <span className={styles.mobileTime}>{formatRelative(run.startedAt)}</span>
      </div>
      <span className={styles.mobileAbsolute}>{formatDateTimeCompact(run.startedAt)}</span>

      <div className={styles.mobileMetrics}>
        <div className={styles.mobileMetric}>
          <span className={styles.mobileMetricLabel}>{t("activity.table.duration")}</span>
          <span className={styles.mobileMetricValue}>{formatDuration(run.durationMs)}</span>
        </div>
        <div className={styles.mobileMetric}>
          <span className={styles.mobileMetricLabel}>{t("activity.table.files")}</span>
          <span className={styles.mobileMetricValue}>
            {formatNumber(run.filesChanged ?? 0)} / {formatNumber(run.filesBackedUp ?? 0)}
          </span>
        </div>
        <div className={styles.mobileMetric}>
          <span className={styles.mobileMetricLabel}>{t("activity.table.transferred")}</span>
          <span className={styles.mobileMetricValue}>
            {run.totalUploadedBytes ? formatSize(run.totalUploadedBytes) : "-"}
          </span>
        </div>
      </div>

      <div className={styles.mobileDestinations}>
        {run.destinationResults.map((result, index) => (
          <DestinationChip
            key={`${result.destId ?? result.destName ?? "dest"}-${String(index)}`}
            result={result}
          />
        ))}
      </div>

      {run.errors.length > 0 && <p className={styles.mobileError}>{run.errors[0]}</p>}
    </Link>
  )
}

const RecentActivity = ({ runs, loading, limit = 6 }: RecentActivityProps) => {
  const { t } = useTranslation()
  const visible = runs.slice(0, limit)

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>{t("dashboard.recentActivity")}</CardTitle>
        <Link to="/activity" className={styles.viewAll}>
          {t("dashboard.viewAllActivity")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className={styles.content}>
        {loading ? (
          <div className={`${styles.empty} space-y-2`}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : !visible.length ? (
          <EmptyState
            icon={<ActivityIcon className="h-5 w-5" />}
            title={t("dashboard.noRunsYet")}
            description={t("activity.empty.description")}
          />
        ) : (
          <ul className={styles.list}>
            {visible.map((run) => (
              <li key={run.id}>
                <Link to="/activity" className={styles.desktopRow}>
                  <RunStatusBadge status={resolveRunStatus(run)} className="mt-0.5 shrink-0" />

                  <div className={styles.identity}>
                    <div className={styles.headline}>
                      <span className={styles.time}>{formatRelative(run.startedAt)}</span>
                      <span className={styles.timeAbsolute}>{formatDateTimeCompact(run.startedAt)}</span>
                      <TriggerBadge trigger={run.trigger} className="ml-auto" />
                    </div>

                    <div className={styles.destinations}>
                      {run.destinationResults.map((result, index) => (
                        <DestinationChip
                          key={`${result.destId ?? result.destName ?? "dest"}-${String(index)}`}
                          result={result}
                        />
                      ))}
                    </div>

                    {run.errors.length > 0 && <p className={styles.error}>{run.errors[0]}</p>}
                  </div>

                  <div className={styles.metrics}>
                    <p className={styles.duration}>{formatDuration(run.durationMs)}</p>
                    <p className={styles.files}>
                      {formatNumber(run.filesChanged ?? 0)} {t("dashboard.filesChanged").toLowerCase()}
                    </p>
                    {run.totalUploadedBytes ? (
                      <p className={styles.transferred}>{formatSize(run.totalUploadedBytes)}</p>
                    ) : null}
                  </div>
                </Link>

                <MobileRunItem run={run} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { RecentActivity }
