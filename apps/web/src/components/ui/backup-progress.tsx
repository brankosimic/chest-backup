import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBackupProgress } from "@/hooks/use-queries"
import { formatSize, formatSpeed } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, Upload, SkipForward, HardDrive, Network } from "lucide-react"
import * as styles from "./backup-progress.styles"

const statusIcon = (status: string) => {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    case "uploading":
      return <Upload className="h-4 w-4 text-blue-500 shrink-0 animate-float-up" />
    case "skipped":
      return <SkipForward className="h-4 w-4 text-amber-500 shrink-0" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
  }
}

const statusBadgeProps = (status: string): { variant: "success" | "destructive" | "default" | "secondary" | "outline"; labelKey: string } => {
  switch (status) {
    case "done": return { variant: "success", labelKey: "status.success" }
    case "error": return { variant: "destructive", labelKey: "status.error" }
    case "uploading": return { variant: "default", labelKey: "dashboard.uploading" }
    case "skipped": return { variant: "secondary", labelKey: "status.skipped" }
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

  if (!progress || progress.status === "idle") return null

  const isActive = ["archiving", "running"].includes(progress.status)
  const isDone = ["completed", "failed"].includes(progress.status)
  const total = progress.destinations.length
  const done = progress.destinations.filter((d) => ["done", "error", "skipped"].includes(d.status)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card className={isActive ? "border-blue-500/50 animate-pulse-glow" : isDone ? "border-green-500/50" : ""}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.headerGroup}>
          <CardTitle className="text-sm font-medium">{t("dashboard.backupInProgress")}</CardTitle>
          {isActive && <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" /></span>}
        </div>
        <div className={styles.headerStats}>
          {progress.archiveSize && <span>{formatSize(progress.archiveSize)}</span>}
          <span>{done}/{total}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress.status === "archiving" && (
          <div className={styles.archivingRow}>
            <Upload className="h-4 w-4 animate-float-up text-blue-500" />
            <span>{t("dashboard.archivingSources")}</span>
          </div>
        )}

        {progress.status !== "archiving" && (
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressBarBase} ${
                isActive
                  ? styles.progressBarActive
                  : isDone
                    ? styles.progressBarDone
                    : "bg-blue-500"
              }`}
              style={{ width: `${pct}%` }}
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
            {progress.destinations.map((dest, i) => (
              <motion.div
                key={dest.name}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                className={`${styles.destRow} ${
                  dest.status === "uploading"
                    ? styles.destRowUploading
                    : dest.status === "done"
                      ? styles.destRowDone
                      : dest.status === "error"
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
                    {dest.status === "uploading" && (
                      <motion.span
                        initial={{ opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-blue-500 font-medium"
                      >
                        {t("dashboard.uploading")}
                      </motion.span>
                    )}
                    {dest.speed && (dest.status === "done" || dest.status === "uploading") && (
                      <span className={styles.speedLabel}>{formatSpeed(dest.speed)}</span>
                    )}
                    <Badge variant={statusBadgeProps(dest.status).variant}>{t(statusBadgeProps(dest.status).labelKey)}</Badge>
                  </div>
                </div>
                {dest.message && dest.status === "error" && (
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
