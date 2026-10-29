"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { RunSort } from "@chest-backup/shared"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEventStream } from "@/hooks/use-event-stream"
import { useTriggerBackup } from "@/hooks/queries/backups"
import { toActivityTab } from "@/lib/enums"
import { ActivityTab, TimeRange } from "@/types/activity"
import type { ActivityFiltersState } from "@/types/activity"
import { isActiveRunPhase, isTerminalRunPhase } from "@/lib/run-phase"
import { invalidateRunQueries } from "@/lib/query-keys"
import { Activity as ActivityIcon, Play, Radio } from "lucide-react"
import { ActivityRunsTab } from "./activity-runs-tab"
import { ActivityLogsTab } from "./activity-logs-tab"
import * as styles from "./page.styles"

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

  const qc = useQueryClient()
  const settledRunId = useRef<string | null>(null)
  const stream = useEventStream(true)
  const triggerMutation = useTriggerBackup()

  const streamPhase = stream.run?.phase
  const streamRunId = stream.run?.runId

  useEffect(() => {
    if (!streamRunId || !streamPhase || !isTerminalRunPhase(streamPhase)) return
    if (settledRunId.current === streamRunId) return
    settledRunId.current = streamRunId
    invalidateRunQueries(qc)
  }, [streamPhase, streamRunId, qc])

  const liveRun = stream.run && isActiveRunPhase(stream.run.phase) ? stream.run : null

  const runBackupNow = (): void => {
    setTab(ActivityTab.Logs)
    triggerMutation.mutate()
  }

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
          <ActivityRunsTab filters={filters} onFiltersChange={setFilters} />
        </TabsContent>

        <TabsContent value={ActivityTab.Logs} className="space-y-4">
          <ActivityLogsTab stream={stream} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { ActivityPage as default }
