import { useTranslation } from "react-i18next"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RunStatusBadge, TriggerBadge } from "@/components/activity/run-status"
import { DestinationChip } from "@/components/activity/destination-chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTimeCompact, formatDuration, formatNumber, formatRelative, formatSize } from "@/lib/utils"
import { resolveRunStatus } from "@/lib/run-status"
import { History, AlertTriangle } from "lucide-react"
import type { RunsTableProps } from "@/types/activity"
import * as styles from "./runs-table.styles"

const RunsTable = ({ runs, loading, onSelect }: RunsTableProps) => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!runs.length) {
    return (
      <EmptyState
        icon={<History className="h-5 w-5" />}
        title={t("activity.empty.title")}
        description={t("activity.empty.description")}
      />
    )
  }

  return (
    <>
      <div className={styles.table}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[7rem] pl-4">{t("activity.table.status")}</TableHead>
              <TableHead className="w-[11rem]">{t("activity.table.when")}</TableHead>
              <TableHead className="w-[8rem]">{t("activity.table.trigger")}</TableHead>
              <TableHead className="w-[6rem] text-right">{t("activity.table.duration")}</TableHead>
              <TableHead className="w-[9rem] text-right">{t("activity.table.files")}</TableHead>
              <TableHead className="w-[7rem] text-right">{t("activity.table.transferred")}</TableHead>
              <TableHead>{t("activity.table.destinations")}</TableHead>
              <TableHead className="w-[6rem] pr-4 text-right">{t("activity.table.errors")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow
                key={run.id}
                onClick={() => {
                  onSelect(run)
                }}
                className="cursor-pointer"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelect(run)
                  }
                }}
              >
                <TableCell className="pl-4">
                  <RunStatusBadge status={resolveRunStatus(run)} />
                </TableCell>
                <TableCell>
                  <div className={styles.when}>
                    <span className={styles.whenRelative}>{formatRelative(run.startedAt)}</span>
                    <span className={styles.whenAbsolute}>{formatDateTimeCompact(run.startedAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <TriggerBadge trigger={run.trigger} />
                </TableCell>
                <TableCell className={styles.numbers}>{formatDuration(run.durationMs)}</TableCell>
                <TableCell className={styles.numbers}>
                  {formatNumber(run.filesChanged ?? 0)}
                  <span className="text-muted-foreground"> / {formatNumber(run.filesBackedUp ?? 0)}</span>
                </TableCell>
                <TableCell className={styles.numbers}>
                  {run.totalUploadedBytes ? formatSize(run.totalUploadedBytes) : "-"}
                </TableCell>
                <TableCell>
                  <div className={styles.destinations}>
                    {run.destinationResults.length ? (
                      run.destinationResults.map((result, index) => (
                        <DestinationChip key={`${result.destId ?? result.destName ?? "dest"}-${String(index)}`} result={result} />
                      ))
                    ) : (
                      <span className={styles.empty}>-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  {run.errors.length ? (
                    <span className={styles.errors}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {formatNumber(run.errors.length)}
                    </span>
                  ) : (
                    <span className={styles.empty}>-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={styles.mobileList}>
        {runs.map((run) => (
          <button
            key={run.id}
            type="button"
            onClick={() => {
              onSelect(run)
            }}
            className={styles.mobileRow}
          >
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
                <DestinationChip key={`${result.destId ?? result.destName ?? "dest"}-${String(index)}`} result={result} />
              ))}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

export { RunsTable }
