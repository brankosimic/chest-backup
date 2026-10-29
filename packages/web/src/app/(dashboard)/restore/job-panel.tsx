import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatSize, cn, destLabel } from "@/lib/utils"
import { RestoreStatus } from "@chest-backup/shared"
import type { JobPanelProps, RestoreStatusMeta } from "@/types/ui"
import { RotateCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import * as styles from "./page.styles"

const statusMeta: Record<RestoreStatus, RestoreStatusMeta> = {
  [RestoreStatus.Running]: { variant: "default", labelKey: "restore.statusRunning" },
  [RestoreStatus.Success]: { variant: "success", labelKey: "restore.statusSuccess" },
  [RestoreStatus.Partial]: { variant: "warning", labelKey: "restore.statusPartial" },
  [RestoreStatus.Failed]: { variant: "destructive", labelKey: "restore.statusFailed" },
}

const JobPanel = ({ job }: JobPanelProps) => {
  const { t } = useTranslation()
  const pct = job.totalFiles > 0 ? Math.round((job.completedFiles / job.totalFiles) * 100) : 0
  const meta = statusMeta[job.status]

  return (
    <Card className={styles.jobCard}>
      <div className={styles.jobHeader}>
        <div className={styles.jobTitle}>
          <RotateCcw className={styles.jobTitleIcon} />
          <span className="font-medium">{t("restore.jobTitle")}</span>
        </div>
        <Badge variant={meta.variant}>
          {job.status === RestoreStatus.Running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : job.status === RestoreStatus.Success ? <CheckCircle2 className="mr-1 h-3 w-3" /> : job.status === RestoreStatus.Failed ? <XCircle className="mr-1 h-3 w-3" /> : null}
          {t(meta.labelKey)}
        </Badge>
      </div>

      <p className={styles.jobMeta}>
        {destLabel({ name: job.destinationName, path: job.destinationPath })} · {job.periodKey} →{" "}
        <span className="font-mono">{job.targetRoot}</span>
      </p>

      <div>
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${String(pct)}%` }} />
        </div>
        <p className={styles.progressMeta}>
          {formatNumber(job.completedFiles)} / {formatNumber(job.totalFiles)} ({String(pct)}%)
        </p>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statBox}>
          <p className={styles.statValue}>{formatNumber(job.restoredCount)}</p>
          <p className={styles.statLabel}>{t("restore.statRestored")}</p>
        </div>
        <div className={styles.statBox}>
          <p className={styles.statValue}>{formatNumber(job.skippedCount)}</p>
          <p className={styles.statLabel}>{t("restore.statSkipped")}</p>
        </div>
        <div className={styles.statBox}>
          <p className={cn(styles.statValue, job.failedCount > 0 && "text-destructive")}>{formatNumber(job.failedCount)}</p>
          <p className={styles.statLabel}>{t("restore.statFailed")}</p>
        </div>
        <div className={styles.statBox}>
          <p className={styles.statValue}>{formatSize(job.restoredBytes)}</p>
          <p className={styles.statLabel}>{t("restore.statBytes")}</p>
        </div>
      </div>

      {job.currentPath && (
        <div className={styles.currentFile} title={job.currentPath}>
          {job.currentPath}
        </div>
      )}

      {job.errors.length > 0 && (
        <div className={styles.errorList}>
          {job.errors.map((error, index) => (
            <p key={`${error}-${String(index)}`} className={styles.errorItem}>
              {error}
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}

export { JobPanel }
