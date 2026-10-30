import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatSize, formatSpeed, formatDuration, cn, destLabel } from "@/lib/utils"
import { DestinationType, RestoreStatus } from "@chest-backup/shared"
import type { JobPanelProps, RestoreStatusMeta } from "@/types/ui"
import { RotateCcw, CheckCircle2, XCircle, AlertTriangle, HardDrive, Network, Clock } from "lucide-react"
import * as styles from "./page.styles"

const statusMeta: Record<RestoreStatus, RestoreStatusMeta> = {
  [RestoreStatus.Running]: { variant: "default", labelKey: "restore.statusRunning" },
  [RestoreStatus.Success]: { variant: "success", labelKey: "restore.statusSuccess" },
  [RestoreStatus.Partial]: { variant: "warning", labelKey: "restore.statusPartial" },
  [RestoreStatus.Failed]: { variant: "destructive", labelKey: "restore.statusFailed" },
  [RestoreStatus.Cancelled]: { variant: "secondary", labelKey: "restore.statusCancelled" },
}

const statusIcon: Partial<Record<RestoreStatus, ReactNode>> = {
  [RestoreStatus.Success]: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />,
  [RestoreStatus.Partial]: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
  [RestoreStatus.Failed]: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
  [RestoreStatus.Cancelled]: <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />,
}

const JobPanel = ({ job }: JobPanelProps) => {
  const { t } = useTranslation()
  const pct = job.totalFiles > 0 ? Math.round((job.completedFiles / job.totalFiles) * 100) : 0
  const filePct = job.currentFileTotal > 0 ? Math.round((job.currentFileBytes / job.currentFileTotal) * 100) : 0
  const isRunning = job.status === RestoreStatus.Running

  return (
    <Card className={cn(styles.jobCard, isRunning && styles.jobCardRunning, job.status === RestoreStatus.Failed && styles.jobCardFailed, !isRunning && job.status !== RestoreStatus.Failed && styles.jobCardDone)}>
      <CardHeader className={styles.jobHeaderRow}>
        <div className={styles.jobTitleGroup}>
          {isRunning ? (
            <span className={styles.liveDot}>
              <span className={styles.liveDotPing} />
              <span className={styles.liveDotCore} />
            </span>
          ) : (
            statusIcon[job.status]
          )}
          <CardTitle className="text-sm font-medium">{isRunning ? t("restore.jobTitle") : t(statusMeta[job.status].labelKey)}</CardTitle>
        </div>
        <div className={styles.jobHeaderStats}>
          {job.dryRun && <Badge variant="secondary">{t("restore.dryRun")}</Badge>}
          {job.speed > 0 && <span className={styles.speedLabel}>{formatSpeed(job.speed)}</span>}
          <span>{formatNumber(job.completedFiles)}/{formatNumber(job.totalFiles)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={styles.progressTrack}>
          <motion.div
            className={`${styles.progressBarBase} ${isRunning ? styles.progressBarActive : job.status === RestoreStatus.Failed ? styles.progressBarFailed : styles.progressBarDone}`}
            initial={{ width: 0 }}
            animate={{ width: `${String(pct)}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          {isRunning && pct < 100 && (
            <div className={styles.barRipple}>
              <div className={styles.barRippleInner} />
            </div>
          )}
        </div>

        <div className={styles.jobMeta}>
          <span>
            {job.destinationType === DestinationType.Local ? <HardDrive className={styles.destIcon} /> : <Network className={styles.destIcon} />}
            {destLabel({ name: job.destinationName, path: job.destinationPath })}
          </span>
          <span>· {job.periodKey} → <span className={styles.monoText}>{job.targetRoot}</span></span>
          {!isRunning && (
            <span>
              · <Clock className="inline h-3 w-3" /> {t("restore.filesCount", { files: formatNumber(job.completedFiles) })}
              {typeof job.durationMs === "number" && ` · ${formatDuration(job.durationMs)}`}
            </span>
          )}
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

        {job.currentPath && isRunning && (
          <div className={styles.currentFileWrap}>
            <div className={styles.currentFile} title={job.currentPath}>
              <RotateCcw className="h-3 w-3 shrink-0 animate-spin" />
              <span className={styles.currentFilePath}>{job.currentPath}</span>
              {job.currentFileTotal > 0 && (
                <span className={styles.currentFileBytes}>
                  {formatSize(job.currentFileBytes)} / {formatSize(job.currentFileTotal)}
                </span>
              )}
            </div>
            {job.currentFileTotal > 0 && (
              <div className={styles.fileProgressTrack}>
                <motion.div
                  className={`${styles.progressBarBase} ${styles.progressBarActive}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${String(filePct)}%` }}
                  transition={{ duration: 0.2, ease: "linear" }}
                />
              </div>
            )}
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
      </CardContent>
    </Card>
  )
}

export { JobPanel }
