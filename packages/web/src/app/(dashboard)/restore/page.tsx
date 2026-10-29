"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  useDestinations,
  useRestoreSnapshots,
  useRestoreSnapshotFiles,
  useStartRestore,
  useActiveRestore,
} from "@/hooks/use-queries"
import { formatDateTime, formatNumber, formatSize, cn } from "@/lib/utils"
import { DestinationType, RestoreStatus } from "@chest-backup/shared"
import type { Destination } from "@chest-backup/shared"
import type { RestoreStatusMeta, JobPanelProps } from "@/types/ui"
import { FolderOpen, Search, RotateCcw, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"
import { FileTree } from "./file-tree"
import * as styles from "./page.styles"

const destLabel = (dest: Pick<Destination, "name" | "path">): string => dest.name ?? dest.path

const statusMeta: Record<RestoreStatus, RestoreStatusMeta> = {
  [RestoreStatus.Running]: { variant: "default", labelKey: "restore.statusRunning" },
  [RestoreStatus.Success]: { variant: "success", labelKey: "restore.statusSuccess" },
  [RestoreStatus.Partial]: { variant: "warning", labelKey: "restore.statusPartial" },
  [RestoreStatus.Failed]: { variant: "destructive", labelKey: "restore.statusFailed" },
}

const JobPanel = ({ job }: JobPanelProps) => {
  const { t } = useTranslation()
  const pct = job.totalFiles > 0 ? Math.round((job.completedFiles / job.totalFiles) * 100) : 0
  const meta = statusMeta[job.status]

  return (
    <Card className={styles.jobCard}>
      <div className={styles.jobHeader}>
        <div className={styles.jobTitle}>
          <RotateCcw className={styles.jobTitleIcon} />
          <span className="font-medium">{t("restore.jobTitle")}</span>
        </div>
        <Badge variant={meta.variant}>
          {job.status === RestoreStatus.Running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : job.status === RestoreStatus.Success ? <CheckCircle2 className="mr-1 h-3 w-3" /> : job.status === RestoreStatus.Failed ? <XCircle className="mr-1 h-3 w-3" /> : null}
          {t(meta.labelKey)}
        </Badge>
      </div>

      <p className={styles.jobMeta}>
        {destLabel({ name: job.destinationName, path: job.destinationPath })} · {job.periodKey} →{" "}
        <span className="font-mono">{job.targetRoot}</span>
      </p>

      <div>
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${String(pct)}%` }} />
        </div>
        <p className={styles.progressMeta}>
          {formatNumber(job.completedFiles)} / {formatNumber(job.totalFiles)} ({String(pct)}%)
        </p>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statBox}>
          <p className={styles.statValue}>{formatNumber(job.restoredCount)}</p>
          <p className={styles.statLabel}>{t("restore.statRestored")}</p>
        </div>
        <div className={styles.statBox}>
          <p className={styles.statValue}>{formatNumber(job.skippedCount)}</p>
          <p className={styles.statLabel}>{t("restore.statSkipped")}</p>
        </div>
        <div className={styles.statBox}>
          <p className={cn(styles.statValue, job.failedCount > 0 && "text-destructive")}>{formatNumber(job.failedCount)}</p>
          <p className={styles.statLabel}>{t("restore.statFailed")}</p>
        </div>
        <div className={styles.statBox}>
          <p className={styles.statValue}>{formatSize(job.restoredBytes)}</p>
          <p className={styles.statLabel}>{t("restore.statBytes")}</p>
        </div>
      </div>

      {job.currentPath && (
        <div className={styles.currentFile} title={job.currentPath}>
          {job.currentPath}
        </div>
      )}

      {job.errors.length > 0 && (
        <div className={styles.errorList}>
          {job.errors.map((error, index) => (
            <p key={`${error}-${String(index)}`} className={styles.errorItem}>
              {error}
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}

const RestorePage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const preselectDest = searchParams.get("destinationId")
  const preselectPeriod = searchParams.get("periodKey")

  const { data: destinations, isLoading: destLoading } = useDestinations()
  const [destId, setDestId] = useState<string | null>(preselectDest)
  const [periodKey, setPeriodKey] = useState<string | null>(preselectPeriod)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [targetRoot, setTargetRoot] = useState("/")
  const [overwrite, setOverwrite] = useState(true)
  const [dryRun, setDryRun] = useState(false)

  useEffect(() => {
    if (preselectDest && destinations?.some((d) => d.id === preselectDest)) setDestId(preselectDest)
  }, [preselectDest, destinations])

  useEffect(() => {
    if (preselectPeriod) setPeriodKey(preselectPeriod)
  }, [preselectPeriod])

  const { data: snapshots, isLoading: snapLoading } = useRestoreSnapshots(destId)
  const { data: files, isLoading: filesLoading } = useRestoreSnapshotFiles(destId, periodKey)

  const startRestore = useStartRestore()
  const { data: activeJob } = useActiveRestore()

  useEffect(() => {
    setSelected(new Set())
    setSearch("")
  }, [periodKey])

  const toggleOne = (path: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const toggleMany = (paths: string[], select: boolean): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const path of paths) {
        if (select) next.add(path)
        else next.delete(path)
      }
      return next
    })
  }

  const selectedCount = selected.size
  const canRestore = !!destId && !!periodKey && !startRestore.isPending && (!activeJob || activeJob.status !== RestoreStatus.Running)

  const runRestore = (): void => {
    if (!destId || !periodKey) return
    startRestore.mutate({
      destinationId: destId,
      periodKey,
      ...(selectedCount > 0 ? { files: [...selected] } : {}),
      targetRoot: targetRoot.trim() || "/",
      overwrite,
      dryRun,
    })
  }

  const snapshot = snapshots?.find((s) => s.key === periodKey)

  return (
    <div className={styles.page}>
      <Header title={t("restore.title")} subtitle={t("restore.subtitle")} />

      {activeJob && <JobPanel job={activeJob} />}

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("restore.snapshot")}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div>
              <Label htmlFor="restore-dest" className={styles.label}>
                {t("restore.destination")}
              </Label>
              <Select
                id="restore-dest"
                value={destId ?? ""}
                onChange={(e) => {
                  setDestId(e.target.value || null)
                  setPeriodKey(null)
                }}
                disabled={destLoading}
              >
                <option value="">{t("restore.selectDestination")}</option>
                {(destinations ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {destLabel(d)} ({d.type === DestinationType.Local ? t("destinations.local") : t("destinations.sftp")})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="restore-snapshot" className={styles.label}>
                {t("restore.snapshotPeriod")}
              </Label>
              <Select
                id="restore-snapshot"
                value={periodKey ?? ""}
                onChange={(e) => {
                  setPeriodKey(e.target.value || null)
                }}
                disabled={!destId || snapLoading}
              >
                <option value="">{snapLoading ? t("common.loading") : t("restore.selectSnapshot")}</option>
                {(snapshots ?? []).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.key} · {formatNumber(s.fileCount)} files · {formatSize(s.totalSize)}
                  </option>
                ))}
              </Select>
              {snapshot?.createdAt && <p className={styles.fieldHint}>{formatDateTime(snapshot.createdAt)}</p>}
            </div>

            {!destId && !destLoading && <p className={styles.hint}>{t("restore.noDestinationHint")}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("restore.files")}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {!periodKey ? (
              <p className={styles.emptyText}>{t("restore.selectSnapshotFirst")}</p>
            ) : filesLoading ? (
              <div className={styles.skeletonList}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className={styles.skeletonRow} />
                ))}
              </div>
            ) : !files?.length ? (
              <p className={styles.emptyText}>{t("restore.noFiles")}</p>
            ) : (
              <>
                <div className={styles.fileToolbar}>
                  <div className={styles.searchWrap}>
                    <Search className={styles.searchIcon} />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                      }}
                      placeholder={t("restore.searchFiles")}
                      className={styles.searchInput}
                    />
                  </div>
                  <div className={styles.fileMeta}>
                    <span>
                      {formatNumber(selectedCount)} / {formatNumber(files.length)} {t("restore.selected")}
                    </span>
                  </div>
                </div>

                <FileTree files={files} search={search} selected={selected} onTogglePath={toggleOne} onToggleMany={toggleMany} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("restore.options")}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div>
              <Label htmlFor="restore-target" className={styles.label}>
                {t("restore.targetRoot")}
              </Label>
              <Input
                id="restore-target"
                value={targetRoot}
                onChange={(e) => {
                  setTargetRoot(e.target.value)
                }}
                placeholder="/"
                disabled={!canRestore}
              />
              <p className={styles.fieldHint}>{t("restore.targetHint")}</p>
            </div>

            <div className={styles.switchRow}>
              <div>
                <p className={styles.sectionTitle}>{t("restore.overwrite")}</p>
                <p className={styles.hint}>{t("restore.overwriteHint")}</p>
              </div>
              <Switch checked={overwrite} onCheckedChange={setOverwrite} />
            </div>

            <div className={styles.switchRow}>
              <div>
                <p className={styles.sectionTitle}>{t("restore.dryRun")}</p>
                <p className={styles.hint}>{t("restore.dryRunHint")}</p>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>

            <Button onClick={runRestore} disabled={!canRestore} className={styles.restoreButton}>
              {startRestore.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  {dryRun ? t("restore.preview") : t("restore.restore")}
                  {selectedCount > 0 && ` (${formatNumber(selectedCount)})`}
                </>
              )}
            </Button>
            {activeJob?.status === RestoreStatus.Running && (
              <p className={styles.busyHint}>
                <Clock className={styles.busyIcon} /> {t("restore.busy")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {!destinations?.length && !destLoading && (
        <Card>
          <CardContent className={styles.emptyState}>
            <FolderOpen className={styles.emptyIcon} />
            {t("restore.noDestinations")}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RestorePage
