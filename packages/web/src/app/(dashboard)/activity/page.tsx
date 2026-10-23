"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import type { BackupRecord, LogLevel } from "@chest-backup/shared"
import { LogLevel as LogLevelEnum } from "@chest-backup/shared"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityFilters } from "@/components/activity/activity-filters"
import { SummaryStrip } from "@/components/activity/summary-strip"
import { RunsTable } from "@/components/activity/runs-table"
import { RunDetailSheet } from "@/components/activity/run-detail-sheet"
import { LogViewer } from "@/components/activity/log-viewer"
import {
  useBackups,
  useBackupStats,
  useDestinations,
  useEventStream,
  useLogs,
  useTriggerBackup,
  useClearLogs,
} from "@/hooks/use-queries"
import { formatDateTime, formatNumber, rangeToFrom } from "@/lib/utils"
import { toActivityTab } from "@/lib/enums"
import { downloadCsv } from "@/lib/export"
import { ActivityTab, TimeRange } from "@/types/activity"
import { RunSort } from "@/types/api"
import { RunPhase } from "@/types/backup"
import type { ActivityFiltersState } from "@/types/activity"
import { Activity as ActivityIcon, Download, Eraser, ChevronLeft, ChevronRight, Play, Radio, Pause, Search } from "lucide-react"
import * as styles from "./page.styles"

const PAGE_SIZE = 25
const LOG_LIMIT = 400

const LOG_LEVELS: LogLevel[] = [LogLevelEnum.Debug, LogLevelEnum.Info, LogLevelEnum.Warn, LogLevelEnum.Error, LogLevelEnum.Fatal]

const DEFAULT_FILTERS: ActivityFiltersState = {
  search: "",
  status: null,
  trigger: null,
  destinationId: null,
  range: TimeRange.All,
  sort: RunSort.Newest,
}

const ActivityPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<ActivityTab>(ActivityTab.Runs)
  const [filters, setFilters] = useState<ActivityFiltersState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedRun, setSelectedRun] = useState<BackupRecord | null>(null)
  const [logSearch, setLogSearch] = useState("")
  const [logLevels, setLogLevels] = useState<LogLevel[]>([])
  const [followLive, setFollowLive] = useState(true)

  const qc = useQueryClient()
  const settledRunId = useRef<string | null>(null)
  const { data: destinations } = useDestinations()
  const stream = useEventStream(true)

  const streamPhase = stream.run?.phase
  const streamRunId = stream.run?.runId

  useEffect(() => {
    if (!streamRunId || !streamPhase) return
    if (streamPhase !== RunPhase.Completed && streamPhase !== RunPhase.Failed) return
    if (settledRunId.current === streamRunId) return

    settledRunId.current = streamRunId
    void qc.invalidateQueries({ queryKey: ["backups"] })
    void qc.invalidateQueries({ queryKey: ["backup-stats"] })
    void qc.invalidateQueries({ queryKey: ["logs"] })
    void qc.invalidateQueries({ queryKey: ["schedule"] })
  }, [streamPhase, streamRunId, qc])

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: filters.status,
      trigger: filters.trigger,
      destinationId: filters.destinationId,
      search: filters.search.trim() || undefined,
      from: rangeToFrom(filters.range),
      sort: filters.sort,
    }),
    [page, filters],
  )

  const { data: runsData, isLoading: runsLoading } = useBackups(query)
  const { data: stats, isLoading: statsLoading } = useBackupStats(query)
  const { data: logsData } = useLogs({ limit: LOG_LIMIT })
  const clearLogs = useClearLogs()
  const triggerMutation = useTriggerBackup(destinations ?? [])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const runs = runsData?.data ?? []
  const total = runsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const liveRun =
    stream.run && ["queued", "resolving", "archiving", "uploading"].includes(stream.run.phase) ? stream.run : null

  const mergedLogs = useMemo(() => {
    const seen = new Set<string>()
    return [...stream.logs, ...(logsData?.data ?? [])]
      .filter((entry) => {
        if (seen.has(entry.id)) return false
        seen.add(entry.id)
        return true
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [logsData, stream.logs])

  const filteredLogs = useMemo(() => {
    const needle = logSearch.trim().toLowerCase()
    return mergedLogs.filter((entry) => {
      if (logLevels.length && !logLevels.includes(entry.level)) return false
      if (!needle) return true
      return entry.message.toLowerCase().includes(needle) || entry.runId?.toLowerCase().includes(needle)
    })
  }, [mergedLogs, logLevels, logSearch])

  const toggleLevel = useCallback((level: LogLevel) => {
    setLogLevels((previous) =>
      previous.includes(level) ? previous.filter((item) => item !== level) : [...previous, level],
    )
  }, [])

  const runBackupNow = (): void => {
    setTab(ActivityTab.Logs)
    triggerMutation.mutate()
  }

  const activeFilterCount =
    (filters.status !== null ? 1 : 0) +
    (filters.trigger !== null ? 1 : 0) +
    (filters.destinationId !== null ? 1 : 0) +
    (filters.range !== TimeRange.All ? 1 : 0)

  return (
    <div className={styles.page}>
      <Header
        title={t("activity.title")}
        subtitle={t("activity.subtitle")}
        action={
          <div className={styles.headerActions}>
            <Button variant="outline" size="sm" onClick={runBackupNow} disabled={triggerMutation.isPending}>
              <Play className="h-3.5 w-3.5" />
              {t("dashboard.runBackup")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCsv(runs)
              }}
              disabled={!runs.length}
            >
              <Download className="h-3.5 w-3.5" />
              {t("activity.exportCsv")}
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(toActivityTab(value))
        }}
      >
        <div className={styles.tabsRow}>
          <TabsList>
            <TabsTrigger value={ActivityTab.Runs}>
              <ActivityIcon className="h-4 w-4" />
              {t("activity.tabs.runs")}
              {total > 0 && <Badge variant="secondary">{formatNumber(total)}</Badge>}
            </TabsTrigger>
            <TabsTrigger value={ActivityTab.Logs}>
              <Radio className="h-4 w-4" />
              {t("activity.tabs.logs")}
              {stream.connected && <span className={styles.liveDot} />}
            </TabsTrigger>
          </TabsList>

          <div className={styles.filterMeta}>
            {liveRun ? (
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} />
                {t("activity.liveRun", { phase: t(`activity.phase.${liveRun.phase}`) })}
              </span>
            ) : (
              <span className={styles.streamState}>
                <span className={stream.connected ? styles.streamDotOnline : styles.streamDotOffline} />
                {stream.connected ? t("activity.streamConnected") : t("activity.streamDisconnected")}
              </span>
            )}
          </div>
        </div>

        <TabsContent value={ActivityTab.Runs} className="space-y-4">
          <SummaryStrip stats={stats} loading={statsLoading} />

          <Card>
            <CardContent className={styles.cardContent}>
              <div className={styles.filterRow}>
                <ActivityFilters value={filters} onChange={setFilters} destinations={destinations ?? []} />
                <div className={styles.filterMeta}>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{t("activity.activeFilters", { count: activeFilterCount })}</Badge>
                  )}
                  <span>{t("activity.resultCount", { shown: formatNumber(runs.length), total: formatNumber(total) })}</span>
                </div>
              </div>

              <div className={styles.tableShell}>
                <RunsTable runs={runs} loading={runsLoading} onSelect={setSelectedRun} />
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage((previous) => Math.max(1, previous - 1))
                    }}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("common.previous")}
                  </Button>
                  <span className={styles.paginationLabel}>
                    {t("activity.pageOf", { page: formatNumber(page), total: formatNumber(totalPages) })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage((previous) => Math.min(totalPages, previous + 1))
                    }}
                    disabled={page >= totalPages}
                  >
                    {t("common.next")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={ActivityTab.Logs} className="space-y-4">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {LOG_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        toggleLevel(level)
                      }}
                      className={`${styles.logLevel} ${logLevels.includes(level) ? styles.logLevelActive : styles.logLevelInactive}`}
                    >
                      {level}
                    </button>
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
                <span>
                  {t("activity.logCount", { count: formatNumber(filteredLogs.length) })}
                  {liveRun && <span className={styles.logLiveNote}>{t("activity.logsForRun")}</span>}
                </span>
                {stream.lastEventAt && <span className="font-mono">{formatDateTime(stream.lastEventAt)}</span>}
              </div>

              <div className={styles.logShell}>
                <LogViewer
                  entries={filteredLogs}
                  emptyLabel={t("activity.logs.empty")}
                  follow={followLive}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RunDetailSheet
        run={selectedRun}
        open={selectedRun !== null}
        onClose={() => {
          setSelectedRun(null)
        }}
      />
    </div>
  )
}

export { ActivityPage as default }
