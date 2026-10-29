"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { BackupRecord } from "@chest-backup/shared"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ActivityFilters } from "@/components/activity/activity-filters"
import { SummaryStrip } from "@/components/activity/summary-strip"
import { RunsTable } from "@/components/activity/runs-table"
import { RunDetailSheet } from "@/components/activity/run-detail-sheet"
import { useBackups, useBackupStats } from "@/hooks/queries/backups"
import { useDestinations } from "@/hooks/queries/destinations"
import { formatNumber, rangeToFrom } from "@/lib/utils"
import { TimeRange } from "@/types/activity"
import type { ActivityFiltersState } from "@/types/activity"
import type { RunQuery } from "@/types/api"
import { ChevronLeft, ChevronRight } from "lucide-react"
import * as styles from "./page.styles"

const PAGE_SIZE = 25

interface ActivityRunsTabProps {
  filters: ActivityFiltersState
  onFiltersChange: (filters: ActivityFiltersState) => void
}

const ActivityRunsTab = ({ filters, onFiltersChange }: ActivityRunsTabProps) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [selectedRun, setSelectedRun] = useState<BackupRecord | null>(null)
  const { data: destinations } = useDestinations()

  const query = useMemo(
    (): RunQuery => ({
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

  const runs = runsData?.data ?? []
  const total = runsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const activeFilterCount =
    (filters.status !== null ? 1 : 0) +
    (filters.trigger !== null ? 1 : 0) +
    (filters.destinationId !== null ? 1 : 0) +
    (filters.range !== TimeRange.All ? 1 : 0)

  return (
    <div className="space-y-4">
      <SummaryStrip stats={stats} loading={statsLoading} />

      <Card>
        <CardContent className={styles.cardContent}>
          <div className={styles.filterRow}>
            <ActivityFilters value={filters} onChange={onFiltersChange} destinations={destinations ?? []} />
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

export { ActivityRunsTab }
