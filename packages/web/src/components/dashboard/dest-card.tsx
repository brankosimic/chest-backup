import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { AlertTriangle, Clock } from "lucide-react"
import { formatSize, formatDuration, cn } from "@/lib/utils"
import { useDestinationUsage } from "@/hooks/use-queries"
import type { DestCardProps } from "@/types/backup"
import * as styles from "./dest-card.styles"

const DestCard = ({ props }: { props: DestCardProps }) => {
  const { t } = useTranslation()
  const { data: usage, isLoading } = useDestinationUsage(props.destination.id)
  return (
    <Link to={`/destinations/${props.destination.id}`} className={styles.linkShell}>
      <Card className={cn(styles.cardShell, usage && (usage.available ? "border-green-500" : "border-destructive"))}>
        {usage && !usage.available && (
          <AlertTriangle className={styles.unavailableIcon} aria-label={t("destinations.unavailable")} />
        )}
        <CardHeader className={styles.header}>
          <CardTitle className={styles.title} title={props.destination.path}>
            {props.destination.name ?? props.destination.path}
          </CardTitle>
          <Badge variant={props.destination.type === "local" ? "default" : "secondary"} className={styles.badge}>
            {props.destination.type === "local" ? t("destinations.local") : t("destinations.sftp")}
          </Badge>
        </CardHeader>
        <CardContent className={styles.content}>
          {isLoading ? (
            <>
              <div className={styles.statRow}>
                <div className={styles.statGroup}>
                  <div className={styles.skeletonNarrow} />
                  <div className={styles.skeletonTextWide} />
                </div>
                <div className={styles.statGroup}>
                  <div className={styles.skeletonWide} />
                  <div className={styles.skeletonTextNarrow} />
                </div>
              </div>
              <div className={styles.footer}>
                <Clock className={styles.clockIcon} />
                <span>{t("dashboard.avgDuration")}: </span>
                <span className={styles.footerValue}>-</span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.statRow}>
                <div>
                  <div className={styles.statValue}>{usage?.fileCount ?? 0}</div>
                  <p className={styles.statLabel}>{t("dashboard.fileCount")}</p>
                </div>
                <div>
                  <div className={styles.statValue}>{formatSize(usage?.totalSize ?? 0)}</div>
                  <p className={styles.statLabel}>{t("dashboard.size")}</p>
                </div>
              </div>
              <div className={styles.footer}>
                <Clock className={styles.clockIcon} />
                <span>{t("dashboard.avgDuration")}: </span>
                <span className={styles.footerValue}>
                  {usage ? formatDuration(usage.avgDurationMs) : "-"}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export { DestCard }
