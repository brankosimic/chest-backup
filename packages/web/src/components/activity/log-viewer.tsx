import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/ui/empty-state"
import { cn, formatClock } from "@/lib/utils"
import type { LogViewerProps } from "@/types/activity"
import { FileText, ChevronDown, ChevronRight } from "lucide-react"
import { LogLevel as LogLevelEnum } from "@chest-backup/shared"
import * as styles from "./log-viewer.styles"

const LEVEL_CLASSES: Record<string, { level: string; message: string }> = {
  debug: { level: styles.levelDebug, message: styles.messageDebug },
  info: { level: styles.levelInfo, message: styles.messageInfo },
  warn: { level: styles.levelWarn, message: styles.messageWarn },
  error: { level: styles.levelError, message: styles.messageError },
  fatal: { level: styles.levelFatal, message: styles.messageFatal },
}

const LogViewer = ({ entries, emptyLabel, follow = true, className }: LogViewerProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  const onScroll = (): void => {
    const el = containerRef.current
    if (!el) return
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el || !follow || !pinnedRef.current) return
    el.scrollTop = el.scrollHeight
  }, [entries, follow])

  const rows = useMemo(() => entries.slice().reverse(), [entries])

  if (!entries.length) {
    return <EmptyState icon={<FileText className="h-5 w-5" />} title={emptyLabel} />
  }

  return (
    <div ref={containerRef} onScroll={onScroll} className={cn(styles.container, className)}>
      {rows.map((entry) => {
        const tone = LEVEL_CLASSES[entry.level] ?? LEVEL_CLASSES[LogLevelEnum.Info]
        const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0
        const isExpanded = expanded === entry.id

        return (
          <div key={entry.id} className={styles.row}>
            <div className={styles.rowBody}>
              <span className={styles.timestamp}>{formatClock(entry.timestamp)}</span>
              <span className={cn(styles.level, tone.level)}>{entry.level}</span>
              <span className={cn("min-w-0 flex-1 break-words", tone.message)}>{entry.message}</span>
              {hasMetadata && (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(isExpanded ? null : entry.id)
                  }}
                  aria-label={t("activity.logs.toggleMetadata")}
                  className={styles.toggle}
                >
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            {isExpanded && hasMetadata && (
              <pre className={styles.metadata}>{JSON.stringify(entry.metadata, null, 2)}</pre>
            )}
          </div>
        )
      })}
    </div>
  )
}

export { LogViewer, LEVEL_CLASSES }
