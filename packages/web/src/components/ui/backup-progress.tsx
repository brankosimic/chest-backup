import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBackupProgress } from "@/hooks/queries/backups"
import { isActiveRunPhase, isTerminalRunPhase } from "@/lib/run-phase"
import { formatSize, formatSpeed } from "@/lib/utils"
import { DestinationType } from "@chest-backup/shared"
import { DestRunStatus, RunPhase } from "@/types/backup"
import type { StatusBadgeProps } from "@/types/ui"
import { CheckCircle2, XCircle, Clock, Upload, SkipForward, HardDrive, Network, Sparkles } from "lucide-react"
import * as styles from "./backup-progress.styles"

const statusIcon = (status: DestRunStatus) => {
  switch (status) {
    case DestRunStatus.Done:
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    case DestRunStatus.Error:
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    case DestRunStatus.Uploading:
      return <Upload className="h-4 w-4 text-blue-500 shrink-0 animate-float-up" />
    case DestRunStatus.Skipped:
      return <SkipForward className="h-4 w-4 text-amber-500 shrink-0" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
  }
}

const statusBadgeProps = (status: DestRunStatus): StatusBadgeProps => {
  if (status === DestRunStatus.Done) return { variant: "success", labelKey: "status.success" }
  if (status === DestRunStatus.Error) return { variant: "destructive", labelKey: "status.error" }
  if (status === DestRunStatus.Uploading) return { variant: "default", labelKey: "dashboard.uploading" }
  if (status === DestRunStatus.Skipped) return { variant: "secondary", labelKey: "status.skipped" }
  return { variant: "outline", labelKey: "common.pending" }
}

const typeIcon = (type: DestinationType) => {
  if (type === DestinationType.Local) return <HardDrive className="h-3 w-3" />
  return <Network className="h-3 w-3" />
}

const typeLabelKey = (type: DestinationType): string => {
  if (type === DestinationType.Local) return "destinations.local"
  return "destinations.sftp"
}

const BackupProgressCard = () => {
  const { t } = useTranslation()
  const { data: progress } = useBackupProgress()
  const lastProgress = useRef(progress)

  useEffect(() => {
    if (progress) lastProgress.current = progress
  }, [progress])

  const display = progress ?? lastProgress.current

  if (!display) return null

  const isActive = isActiveRunPhase(display.phase)
  const isFailed = display.phase === RunPhase.Failed
  const isDone = isTerminalRunPhase(display.phase)
  const settled = !isActive && isDone
  const total = display.destinations.length
  const terminalStatuses: DestRunStatus[] = [DestRunStatus.Done, DestRunStatus.Error, DestRunStatus.Skipped]
  const done = display.destinations.filter((d) => terminalStatuses.includes(d.status)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const titleKey = isFailed ? "dashboard.backupFailed" : isDone ? "dashboard.backupCompleted" : "dashboard.backupInProgress"

  const borderClass = isActive
    ? "border-blue-500/50 animate-pulse-glow"
    : isFailed
      ? "border-red-500/50"
      : isDone
        ? "border-green-500/50"
        : ""

  if (!isActive && !settled) return null

  return (
    <Card className={borderClass}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.headerGroup}>
          <CardTitle className="text-sm font-medium">{t(titleKey)}</CardTitle>
          {isActive && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
          )}
          {isFailed && <XCircle className="h-4 w-4 text-red-500" />}
          {isDone && !isFailed && <Sparkles className="h-4 w-4 text-green-500" />}
        </div>
        <div className={styles.headerStats}>
          {display.archiveSize && <span>{formatSize(display.archiveSize)}</span>}
          <span>
            {done}/{total}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={styles.progressTrack}>
          <motion.div
            className={`${styles.progressBarBase} ${
              isActive ? styles.progressBarActive : isFailed ? styles.progressBarFailed : styles.progressBarDone
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${String(pct)}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          {isActive && pct < 100 && (
            <div className={styles.barRipple}>
              <div className={styles.barRippleInner} />
            </div>
          )}
        </div>

        {isActive && !display.archiveSize && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.archivingRow}>
            <Upload className="h-4 w-4 animate-float-up text-blue-500" />
            <span>{t("dashboard.archivingSources")}</span>
          </motion.div>
        )}

        <div className="space-y-2">
          {display.destinations.map((dest) => (
            <div
              key={dest.name + dest.path}
              className={`${styles.destRow} ${
                dest.status === DestRunStatus.Uploading
                  ? styles.destRowUploading
                  : dest.status === DestRunStatus.Done
                    ? styles.destRowDone
                    : dest.status === DestRunStatus.Error
                      ? styles.destRowError
                      : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {statusIcon(dest.status)}
                  <span className="truncate font-medium">{dest.name}</span>
                  <Badge variant="outline" className={styles.destBadge}>
                    {typeIcon(dest.type)}
                    {t(typeLabelKey(dest.type))}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {dest.status === DestRunStatus.Uploading && (
                    <span className="text-xs text-blue-500 font-medium">
                      {t("dashboard.uploading")}
                    </span>
                  )}
                  {dest.speed && [DestRunStatus.Done, DestRunStatus.Uploading].includes(dest.status) && (
                    <span className={styles.speedLabel}>{formatSpeed(dest.speed)}</span>
                  )}
                  {dest.status === DestRunStatus.Done && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <Badge variant={statusBadgeProps(dest.status).variant}>
                    {t(statusBadgeProps(dest.status).labelKey)}
                  </Badge>
                </div>
              </div>
              {dest.message && dest.status === DestRunStatus.Error && (
                <p className="text-xs text-red-500 pl-6">
                  {dest.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { BackupProgressCard }
