import { useTranslation } from "react-i18next"
import type { StoreResult } from "@chest-backup/shared"
import { DestinationType } from "@chest-backup/shared"
import { CheckCircle2, XCircle, SkipForward, HardDrive, Network, Clock, RotateCcw } from "lucide-react"
import { cn, formatDuration, formatSize } from "@/lib/utils"
import { DestOutcome } from "@/types/activity"
import type { DestResultProps } from "@/types/activity"
import * as styles from "./destination-chip.styles"

const outcomeOf = (result: StoreResult): DestOutcome => {
  if (result.skipped) return DestOutcome.Skipped
  if (!result.success) return DestOutcome.Error
  return DestOutcome.Done
}

const outcomeTone = (outcome: DestOutcome): string => {
  if (outcome === DestOutcome.Done) return styles.chipDone
  if (outcome === DestOutcome.Error) return styles.chipError
  return styles.chipMuted
}

const DestinationChip = ({ result }: DestResultProps) => {
  const outcome = outcomeOf(result)
  const name = result.destName ?? result.destPath ?? result.destLabel ?? "?"
  const TypeIcon = result.destType === DestinationType.Local ? HardDrive : Network
  const StatusIcon = outcome === DestOutcome.Done ? CheckCircle2 : outcome === DestOutcome.Error ? XCircle : SkipForward

  return (
    <span className={cn(styles.chip, outcomeTone(outcome))} title={result.destPath ?? name}>
      <TypeIcon className={styles.chipIcon} />
      <span className={styles.chipLabel}>{name}</span>
      <StatusIcon className="h-3 w-3" />
    </span>
  )
}

const DestinationOutcomeRow = ({ result, onRestore }: DestResultProps) => {
  const { t } = useTranslation()
  const TypeIcon = result.destType === DestinationType.Local ? HardDrive : Network
  const uploaded = result.uploadedCount ?? result.uploaded?.length ?? 0
  const deleted = result.deletedCount ?? result.deleted?.length ?? 0
  const failed = result.failedCount ?? 0
  const restorable = !result.skipped

  return (
    <div className={styles.outcomeCard}>
      <div className={styles.outcomeHeader}>
        <div className={styles.outcomeIdentity}>
          <TypeIcon className={styles.outcomeIcon} />
          <div className={styles.outcomeText}>
            <p className={styles.outcomeName}>{result.destName ?? result.destPath ?? result.destLabel}</p>
            <p className={styles.outcomePath}>{result.destPath}</p>
          </div>
        </div>
        <div className={styles.outcomeMeta}>
          {result.durationMs !== undefined && result.durationMs > 0 && (
            <span className={styles.outcomeTiming}>
              <Clock className="h-3 w-3" />
              {formatDuration(result.durationMs)}
            </span>
          )}
          {result.speed !== undefined && result.speed > 0 && (
            <span className={styles.outcomeTiming}>{formatSize(result.speed)}/s</span>
          )}
          {restorable && result.destId && onRestore && (
            <button
              type="button"
              onClick={() => {
                onRestore(result.destId as string)
              }}
              className={styles.restoreButton}
            >
              <RotateCcw className={styles.restoreIcon} />
              {t("activity.detail.restore")}
            </button>
          )}
        </div>
      </div>

      <div className={styles.outcomeStats}>
        <span>
          {t("activity.detail.uploaded")}: <span className={styles.outcomeValue}>{String(uploaded)}</span>
        </span>
        <span>
          {t("activity.detail.deleted")}: <span className={styles.outcomeValue}>{String(deleted)}</span>
        </span>
        {failed > 0 && (
          <span>
            {t("activity.detail.failed")}: <span className={styles.outcomeValue}>{String(failed)}</span>
          </span>
        )}
        {result.skipped && (
          <span>{t("activity.detail.skippedReason", { reason: result.skippedReason ?? "no-changes" })}</span>
        )}
      </div>

      {result.error && <p className={styles.outcomeError}>{result.error}</p>}

      {result.uploaded && result.uploaded.length > 0 && (
        <details className={styles.outcomeFiles}>
          <summary className={styles.fileSummary}>
            {t("activity.detail.showFiles", { count: result.uploaded.length })}
          </summary>
          <ul className={styles.outcomeFileList}>
            {result.uploaded.map((path) => (
              <li key={path} className="break-all">
                {path}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export { DestinationChip, DestinationOutcomeRow, outcomeOf }
