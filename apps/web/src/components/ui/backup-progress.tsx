import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBackupProgress } from "@/hooks/use-queries"
import { formatSize, formatSpeed } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, Upload, SkipForward, HardDrive, Network, Loader2, Sparkles } from "lucide-react"
import type { BadgeProps } from "@/types/backup"
import * as styles from "./backup-progress.styles"

const DestStatus = {
  Done: "done",
  Error: "error",
  Uploading: "uploading",
  Skipped: "skipped",
} as const

type DestStatus = (typeof DestStatus)[keyof typeof DestStatus]

const statusIcon = (status: string) => {
  switch (status) {
    case DestStatus.Done:
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    case DestStatus.Error:
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    case DestStatus.Uploading:
      return <Upload className="h-4 w-4 text-blue-500 shrink-0 animate-float-up" />
    case DestStatus.Skipped:
      return <SkipForward className="h-4 w-4 text-amber-500 shrink-0" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
  }
}

const statusBadgeProps = (status: string): BadgeProps => {
  switch (status) {
    case DestStatus.Done: return { variant: "success", labelKey: "status.success" }
    case DestStatus.Error: return { variant: "destructive", labelKey: "status.error" }
    case DestStatus.Uploading: return { variant: "default", labelKey: "dashboard.uploading" }
    case DestStatus.Skipped: return { variant: "secondary", labelKey: "status.skipped" }
    default: return { variant: "outline", labelKey: "common.pending" }
  }
}

const typeIcon = (type: string) => {
  if (type === "local") return <HardDrive className="h-3 w-3" />
  return <Network className="h-3 w-3" />
}

const typeLabelKey = (type: string): string => {
  if (type === "local") return "destinations.local"
  return "destinations.sftp"
}

const BackupProgressCard = () => {
  const { t } = useTranslation()
  const { data: progress } = useBackupProgress()
  const lastProgress = useRef(progress)

  useEffect(() => {
    if (progress && progress.status !== "idle") lastProgress.current = progress
  }, [progress])

  const display = progress?.status !== "idle" ? progress : lastProgress.current

  if (!display || display.status === "idle") return null

  const isStarting = display.status === "starting"
  const isActive = ["archiving", "running"].includes(display.status)
  const isDone = ["completed", "failed"].includes(display.status)
  const total = display.destinations.length
  const terminalStatuses = [DestStatus.Done, DestStatus.Error, DestStatus.Skipped] as const
  const done = display.destinations.filter((d) => (terminalStatuses as readonly string[]).includes(d.status)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const borderClass = isStarting ? "border-blue-500/30" : isActive ? "border-blue-500/50 animate-pulse-glow" : isDone ? "border-green-500/50" : ""

  return (
    <Card className={borderClass}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.headerGroup}>
          <CardTitle className="text-sm font-medium">
            {isStarting ? t("dashboard.startingBackup") : t("dashboard.backupInProgress")}
          </CardTitle>
          {isStarting && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          {isActive && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
          )}
          {isDone && <Sparkles className="h-4 w-4 text-green-500" />}
        </div>
        <div className={styles.headerStats}>
          {display.archiveSize && <span>{formatSize(display.archiveSize)}</span>}
          <span>{done}/{total}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isStarting && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.archivingRow}
          >
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span>{t("dashboard.preparingBackup")}</span>
          </motion.div>
        )}

        {display.status === "archiving" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.archivingRow}
          >
            <Upload className="h-4 w-4 animate-float-up text-blue-500" />
            <span>{t("dashboard.archivingSources")}</span>
          </motion.div>
        )}

        {display.status !== "starting" && display.status !== "archiving" && (
          <div className={styles.progressTrack}>
            <motion.div
              className={`${styles.progressBarBase} ${
                isActive
                  ? styles.progressBarActive
                  : isDone
                    ? styles.progressBarDone
                    : "bg-blue-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {isActive && pct < 100 && (
              <div className={styles.barRipple}>
                <div className={styles.barRippleInner} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {display.destinations.map((dest, i) => (
              <motion.div
                key={dest.name + dest.path}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                className={`${styles.destRow} ${
                  dest.status === DestStatus.Uploading
                    ? styles.destRowUploading
                    : dest.status === DestStatus.Done
                      ? styles.destRowDone
                      : dest.status === DestStatus.Error
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
                    {dest.status === DestStatus.Uploading && (
                      <motion.span
                        initial={{ opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-blue-500 font-medium"
                      >
                        {t("dashboard.uploading")}
                      </motion.span>
                    )}
                    {dest.speed && ([DestStatus.Done, DestStatus.Uploading] as string[]).includes(dest.status) && (
                      <span className={styles.speedLabel}>{formatSpeed(dest.speed)}</span>
                    )}
                    {dest.status === DestStatus.Done && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </motion.div>
                    )}
                    <Badge variant={statusBadgeProps(dest.status).variant}>{t(statusBadgeProps(dest.status).labelKey)}</Badge>
                  </div>
                </div>
                {dest.message && dest.status === DestStatus.Error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-red-500 pl-6"
                  >
                    {dest.message}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export { BackupProgressCard }
