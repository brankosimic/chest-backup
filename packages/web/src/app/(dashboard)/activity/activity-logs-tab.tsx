"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { LogEntry, LogLevel } from "@chest-backup/shared"
import { LogLevel as LogLevelEnum } from "@chest-backup/shared"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogViewer } from "@/components/activity/log-viewer"
import { LogLevelButton } from "@/components/activity/log-level-button"
import { useLogs, useClearLogs } from "@/hooks/queries/backups"
import { formatDateTime, formatNumber } from "@/lib/utils"
import type { StreamState } from "@/types/activity"
import { Eraser, Pause, Radio, Search } from "lucide-react"
import * as styles from "./page.styles"

const LOG_LIMIT = 400

const LOG_LEVELS: LogLevel[] = [LogLevelEnum.Debug, LogLevelEnum.Info, LogLevelEnum.Warn, LogLevelEnum.Error, LogLevelEnum.Fatal]

interface ActivityLogsTabProps {
  stream: StreamState
}

const mergeLogEntries = (streamLogs: LogEntry[], storedLogs: LogEntry[]): LogEntry[] => {
  const seen = new Set<string>()
  return [...streamLogs, ...storedLogs]
    .filter((entry) => {
      if (seen.has(entry.id)) return false
      seen.add(entry.id)
      return true
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

const filterLogEntries = (logs: LogEntry[], levels: LogLevel[], search: string): LogEntry[] => {
  const needle = search.trim().toLowerCase()
  return logs.filter((entry) => {
    if (levels.length && !levels.includes(entry.level)) return false
    if (!needle) return true
    return entry.message.toLowerCase().includes(needle) || entry.runId?.toLowerCase().includes(needle)
  })
}

const ActivityLogsTab = ({ stream }: ActivityLogsTabProps) => {
  const { t } = useTranslation()
  const [logSearch, setLogSearch] = useState("")
  const [logLevels, setLogLevels] = useState<LogLevel[]>([])
  const [followLive, setFollowLive] = useState(true)

  const { data: logsData } = useLogs({ limit: LOG_LIMIT })
  const clearLogs = useClearLogs()

  const mergedLogs = useMemo(() => mergeLogEntries(stream.logs, logsData?.data ?? []), [logsData, stream.logs])
  const filteredLogs = useMemo(() => filterLogEntries(mergedLogs, logLevels, logSearch), [mergedLogs, logLevels, logSearch])

  const toggleLevel = useCallback((level: LogLevel) => {
    setLogLevels((previous) => (previous.includes(level) ? previous.filter((item) => item !== level) : [...previous, level]))
  }, [])

  return (
    <Card>
      <CardContent className={styles.cardContent}>
        <div className={styles.logToolbar}>
          <div className={styles.logSearch}>
            <Search className={styles.logSearchIcon} />
            <input
              value={logSearch}
              onChange={(event) => {
                setLogSearch(event.target.value)
              }}
              placeholder={t("activity.filters.searchLogs")}
              className={styles.logSearchInput}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {LOG_LEVELS.map((level) => (
              <LogLevelButton key={level} level={level} active={logLevels.includes(level)} onToggle={toggleLevel} />
            ))}
          </div>

          <div className={styles.logActions}>
            <Button
              variant={followLive ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setFollowLive((previous) => !previous)
              }}
            >
              {followLive ? <Radio className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {followLive ? t("activity.followLive") : t("activity.followPaused")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearLogs.mutate()
              }}
              disabled={clearLogs.isPending}
            >
              <Eraser className="h-3.5 w-3.5" />
              {t("activity.clearLogs")}
            </Button>
          </div>
        </div>

        <div className={styles.logMeta}>
          <span>{t("activity.logCount", { count: formatNumber(filteredLogs.length) })}</span>
          {stream.lastEventAt && <span className="font-mono">{formatDateTime(stream.lastEventAt)}</span>}
        </div>

        <div className={styles.logShell}>
          <LogViewer entries={filteredLogs} emptyLabel={t("activity.logs.empty")} follow={followLive} className="h-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export { ActivityLogsTab }
