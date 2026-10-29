import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { AlertTriangle, Clock, HardDrive, Server } from "lucide-react"
import { formatSize, formatDuration, cn } from "@/lib/utils"
import { DestinationType } from "@chest-backup/shared"
import { useDestinationUsage } from "@/hooks/use-queries"
import type { ConnectionRow, DiskUsageBlockProps } from "@/types/ui"
import type { DestCardProps } from "@/types/backup"
import * as styles from "./destination-row.styles"

const DiskUsageBlock = ({ diskSpace, isLoading }: DiskUsageBlockProps) => {
  const { t } = useTranslation()
  const hasDisk = !!diskSpace && diskSpace.total > 0

  return (
    <div className={styles.disk}>
      <div className={styles.row}>
        <span className={styles.rowLabel}>{t("dashboard.diskUsage")}</span>
        {isLoading ? (
          <span className={styles.skeletonTextWide} />
        ) : hasDisk ? (
          <span className={styles.rowValue}>
            {formatSize(diskSpace.used)} / {formatSize(diskSpace.total)}
          </span>
        ) : (
          <span className={styles.rowValue}>-</span>
        )}
      </div>
      <div className={styles.barTrack}>
        {isLoading ? (
          <div className={cn(styles.diskBar, styles.skeletonBar)} />
        ) : hasDisk ? (
          <div
            className={styles.diskBar}
            style={{ width: `${String((diskSpace.used / diskSpace.total) * 100)}%` }}
          />
        ) : null}
      </div>
    </div>
  )
}

const DestinationRow = ({ destination }: DestCardProps) => {
  const { t } = useTranslation()
  const isLocal = destination.type === DestinationType.Local
  const skipped = !!destination.skip
  const { data: usage, isLoading } = useDestinationUsage(destination.id)

  const baseRows: ConnectionRow[] = isLocal
    ? [{ label: t("destinations.path"), value: destination.path }]
    : [
        { label: t("destinations.host"), value: destination.host ? `${destination.host}:${String(destination.port ?? 22)}` : "-" },
        ...(destination.user ? [{ label: t("destinations.user"), value: destination.user }] : []),
      ]

  const parallelRow: ConnectionRow | null =
    destination.parallel === undefined
      ? null
      : { label: t("destinations.parallel"), value: destination.parallel ? t("common.yes") : t("common.no") }

  const connectionRows = parallelRow ? [...baseRows, parallelRow] : baseRows

  return (
    <Link to={`/destinations/${destination.id}`} className={styles.linkShell}>
      <Card className={cn(styles.cardShell, skipped ? "border-amber-500" : usage && (usage.available ? "border-green-500" : "border-destructive"))}>
        <div className={styles.body}>
          <div className={styles.identity}>
            <span className={styles.iconWrap}>
              {isLocal ? <HardDrive className={styles.icon} /> : <Server className={styles.icon} />}
            </span>
            <div className={styles.titleBlock}>
              <div className={styles.titleRow}>
                <span className={styles.title}>{destination.name ?? destination.path}</span>
                <Badge variant={isLocal ? "default" : "secondary"}>
                  {isLocal ? t("destinations.local") : t("destinations.sftp")}
                </Badge>
                {skipped && (
                  <Badge variant="outline" className={styles.skippedBadge}>
                    {t("status.skipped")}
                  </Badge>
                )}
              </div>
              <span className={styles.subtitle}>
                {!skipped && usage?.available === false ? t("destinations.unavailable") : destination.path}
              </span>
              {!skipped && usage && !usage.available && (
                <AlertTriangle className={styles.unavailableIcon} aria-label={t("destinations.unavailable")} />
              )}
            </div>
          </div>

          <div className={styles.stats}>
            {isLoading ? (
              <>
                <div className={styles.statGroup}>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </div>
                <div className={styles.statGroup}>
                  <div className={styles.skeletonValueWide} />
                  <div className={styles.skeletonText} />
                </div>
              </>
            ) : (
              <>
                <div className={styles.statGroup}>
                  <span className={styles.statValue}>{usage?.fileCount ?? 0}</span>
                  <span className={styles.statLabel}>{t("dashboard.fileCount")}</span>
                </div>
                <div className={styles.statGroup}>
                  <span className={styles.statValue}>{formatSize(usage?.totalSize ?? 0)}</span>
                  <span className={styles.statLabel}>{t("dashboard.size")}</span>
                </div>
              </>
            )}
          </div>

          <DiskUsageBlock diskSpace={usage?.diskSpace} isLoading={isLoading} />

          <div className={styles.details}>
            {connectionRows.map((row) => (
              <div key={row.label} className={styles.detailRow}>
                <span className={styles.detailLabel}>{row.label}</span>
                <span className={styles.detailValue} title={row.value}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t("dashboard.avgDuration")}</span>
              <span className={cn(styles.detailValue, styles.duration)}>
                <Clock className={styles.clockIcon} />
                {isLoading ? "-" : usage ? formatDuration(usage.avgDurationMs) : "-"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export { DestinationRow }
