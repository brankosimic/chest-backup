import { useTranslation } from "react-i18next"
import { CheckCircle2, XCircle, MinusCircle, Timer, Upload } from "lucide-react"
import { cn, formatDuration, formatNumber, formatSize } from "@/lib/utils"
import { SummaryTone } from "@/types/activity"
import type { SummaryStripProps } from "@/types/activity"
import * as styles from "./summary-strip.styles"

const toneClass = (tone: SummaryTone): string => {
  if (tone === SummaryTone.Success) return styles.toneSuccess
  if (tone === SummaryTone.Warning) return styles.toneWarning
  if (tone === SummaryTone.Destructive) return styles.toneDestructive
  if (tone === SummaryTone.Muted) return styles.toneMuted
  return styles.toneDefault
}

const SummaryStrip = ({ stats, loading }: SummaryStripProps) => {
  const { t } = useTranslation()

  if (loading || !stats) {
    return <div className="h-20 animate-pulse rounded-lg bg-muted" />
  }

  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
  const failedTotal = stats.failed + stats.partial
  const items = [
    {
      key: "total",
      label: t("activity.summary.runs"),
      value: formatNumber(stats.total),
      icon: <Timer className="h-4 w-4 text-muted-foreground" />,
      tone: SummaryTone.Default,
      hint: undefined,
    },
    {
      key: "success",
      label: t("activity.summary.success"),
      value: `${String(successRate)}%`,
      icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      tone: SummaryTone.Success,
      hint: `${formatNumber(stats.success)} / ${formatNumber(stats.total)}`,
    },
    {
      key: "failed",
      label: t("activity.summary.problems"),
      value: formatNumber(failedTotal),
      icon: failedTotal > 0 ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
      tone: failedTotal > 0 ? SummaryTone.Destructive : SummaryTone.Muted,
      hint:
        stats.partial > 0
          ? t("activity.summary.partialHint", {
              partial: formatNumber(stats.partial),
              failed: formatNumber(stats.failed),
            })
          : undefined,
    },
    {
      key: "skipped",
      label: t("activity.summary.skipped"),
      value: formatNumber(stats.skipped),
      icon: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
      tone: SummaryTone.Muted,
      hint: undefined,
    },
    {
      key: "duration",
      label: t("activity.summary.avgDuration"),
      value: formatDuration(stats.avgDuration),
      icon: <Timer className="h-4 w-4 text-muted-foreground" />,
      tone: SummaryTone.Default,
      hint: undefined,
    },
    {
      key: "transferred",
      label: t("activity.summary.transferred"),
      value: formatSize(stats.totalUploadedBytes),
      icon: <Upload className="h-4 w-4 text-muted-foreground" />,
      tone: SummaryTone.Default,
      hint: undefined,
    },
  ]

  return (
    <div className={styles.metrics}>
      {items.map((item) => (
        <div key={item.key} className={styles.metric} title={item.hint}>
          <div className={styles.metricLabel}>
            {item.icon}
            <span className="truncate">{item.label}</span>
          </div>
          <p className={cn(styles.metricValue, toneClass(item.tone))}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

export { SummaryStrip }
