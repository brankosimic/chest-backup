import { useTranslation } from "react-i18next"
import { Sheet } from "@/components/ui/sheet"
import { RunStatusBadge, TriggerBadge } from "@/components/activity/run-status"
import { DestinationOutcomeRow } from "@/components/activity/destination-chip"
import { formatDateTime, formatDuration, formatNumber, formatRelative, formatSize } from "@/lib/utils"
import { resolveRunStatus } from "@/lib/run-status"
import { AlertTriangle, Files, Timer, Upload } from "lucide-react"
import type { RunDetailSheetProps } from "@/types/activity"
import * as styles from "./run-detail-sheet.styles"

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={styles.detailRow}>
    <span className={styles.detailLabel}>{label}</span>
    <span className={styles.detailValue}>{value}</span>
  </div>
)

const RunDetailSheet = ({ run, open, onClose }: RunDetailSheetProps) => {
  const { t } = useTranslation()

  if (!run) return null

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className={styles.titleRow}>
          <RunStatusBadge status={resolveRunStatus(run)} />
          <span className="truncate">{run.archiveName ?? run.runId}</span>
        </span>
      }
      description={
        <span className={styles.descriptionRow}>
          <TriggerBadge trigger={run.trigger} />
          <span>{formatDateTime(run.startedAt)}</span>
          <span className="text-muted-foreground">·</span>
          <span>{formatRelative(run.startedAt)}</span>
        </span>
      }
    >
      <div className="space-y-5 p-5">
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>
              <Timer className="h-3.5 w-3.5" />
              {t("activity.detail.duration")}
            </div>
            <p className={styles.metricValue}>{formatDuration(run.durationMs)}</p>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>
              <Files className="h-3.5 w-3.5" />
              {t("activity.detail.filesChanged")}
            </div>
            <p className={styles.metricValue}>
              {formatNumber(run.filesChanged ?? 0)}
              <span className={styles.metricSplit}> / {formatNumber(run.filesBackedUp ?? 0)}</span>
            </p>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>
              <Upload className="h-3.5 w-3.5" />
              {t("activity.detail.transferred")}
            </div>
            <p className={styles.metricValue}>{formatSize(run.totalUploadedBytes ?? 0)}</p>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("activity.detail.errors")}
            </div>
            <p className={styles.metricValue}>{formatNumber(run.errors.length)}</p>
          </div>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t("activity.detail.runInfo")}</h3>
          <div className={styles.details}>
            <DetailRow
              label={t("activity.detail.runId")}
              value={<span className={styles.detailValueMono}>{run.runId}</span>}
            />
            <DetailRow label={t("activity.detail.startedAt")} value={formatDateTime(run.startedAt)} />
            <DetailRow label={t("activity.detail.finishedAt")} value={formatDateTime(run.finishedAt)} />
            <DetailRow label={t("activity.detail.trigger")} value={<TriggerBadge trigger={run.trigger} />} />
            {run.archiveName && (
              <DetailRow
                label={t("activity.detail.archive")}
                value={<span className={styles.detailValueMono}>{run.archiveName}</span>}
              />
            )}
          </div>
        </section>

        {run.errors.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitleError}>{t("activity.detail.errors")}</h3>
            <ul className={styles.errorList}>
              {run.errors.map((error, index) => (
                <li key={`${error}-${String(index)}`} className={styles.errorItem}>
                  {error}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {t("activity.detail.destinations")}{" "}
            <span className="font-normal text-muted-foreground">({formatNumber(run.destinationResults.length)})</span>
          </h3>
          {run.destinationResults.length > 0 ? (
            <div className={styles.destinationList}>
              {run.destinationResults.map((result, index) => (
                <DestinationOutcomeRow key={`${result.destId ?? result.destName ?? "dest"}-${String(index)}`} result={result} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyDestinations}>{t("activity.detail.noDestinations")}</p>
          )}
        </section>
      </div>
    </Sheet>
  )
}

export { RunDetailSheet }
