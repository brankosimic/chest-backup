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
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useDestinations } from "@/hooks/queries/destinations"
import { useRestoreSnapshots, useRestoreSnapshotCount, useRestoreSnapshotFiles, useStartRestore, useActiveRestore } from "@/hooks/queries/restores"
import { formatDateTime, formatNumber, formatSize, destLabel } from "@/lib/utils"
import { DestinationType, RestoreStatus } from "@chest-backup/shared"
import { FolderOpen, Search, RotateCcw, Clock, HardDrive, Network } from "lucide-react"
import { FileTree } from "./file-tree"
import { JobPanel } from "./job-panel"
import * as styles from "./page.styles"

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
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (preselectDest && destinations?.some((d) => d.id === preselectDest)) setDestId(preselectDest)
  }, [preselectDest, destinations])

  useEffect(() => {
    if (preselectPeriod) setPeriodKey(preselectPeriod)
  }, [preselectPeriod])

  const { data: snapshots, isLoading: snapLoading } = useRestoreSnapshots(destId)
  const { data: snapshotCount } = useRestoreSnapshotCount(destId, periodKey)
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
  const canRestore = !!destId && !!periodKey && selectedCount > 0 && !startRestore.isPending && (!activeJob || activeJob.status !== RestoreStatus.Running)
  const snapshot = snapshots?.find((s) => s.key === periodKey)
  const dest = (destinations ?? []).find((d) => d.id === destId)
  const target = targetRoot.trim() || "/"

  const openConfirm = (): void => {
    if (!canRestore) return
    setConfirmOpen(true)
  }

  const confirmRestore = (): void => {
    if (!destId || !periodKey) return
    startRestore.mutate({
      destinationId: destId,
      periodKey,
      ...(selectedCount > 0 ? { files: [...selected] } : {}),
      targetRoot: target,
      overwrite,
      dryRun,
    })
    setConfirmOpen(false)
  }

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
                {(snapshots ?? []).map((s) => {
                  const isCurrent = s.key === periodKey
                  const fileCount = isCurrent && snapshotCount ? snapshotCount.fileCount : s.fileCount
                  const totalSize = isCurrent && snapshotCount ? snapshotCount.totalSize : s.totalSize
                  return (
                    <option key={s.key} value={s.key}>
                      {s.key}
                      {fileCount !== null ? ` · ${formatNumber(fileCount)} files · ${formatSize(totalSize ?? 0)}` : ""}
                    </option>
                  )
                })}
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
                {["100%", "82%", "92%", "64%", "78%", "55%"].map((width, i) => (
                  <Skeleton key={i} style={{ width }} className={styles.skeletonRow} />
                ))}
              </div>
            ) : !files?.length ? (
              <p className={styles.emptyText}>{t("restore.noFiles")}</p>
            ) : (
              <div className={styles.fileTreeWrap}>
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
              </div>
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

            <Button onClick={openConfirm} disabled={!canRestore} className={styles.restoreButton}>
              <RotateCcw className="h-4 w-4" />
              {dryRun ? t("restore.preview") : t("restore.restore")}
              {selectedCount > 0 && ` (${formatNumber(selectedCount)})`}
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

      <ConfirmDialog
        open={confirmOpen}
        title={t("restore.confirmTitle")}
        description={t("restore.confirmQuestion", { count: formatNumber(selectedCount), snapshot: periodKey ?? "", target })}
        confirmLabel={dryRun ? t("restore.preview") : t("restore.restore")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmRestore}
        onCancel={() => {
          setConfirmOpen(false)
        }}
      >
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>{t("restore.confirmDestination")}</span>
          <span className={styles.confirmValue}>
            {dest && (dest.type === DestinationType.Local ? <HardDrive className="h-3.5 w-3.5" /> : <Network className="h-3.5 w-3.5" />)}
            {dest ? destLabel(dest) : "—"}
          </span>
        </div>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>{t("restore.confirmTarget")}</span>
          <span className={`${styles.confirmValue} font-mono`}>{target}</span>
        </div>
        {dryRun ? (
          <p className={styles.confirmNote}>{t("restore.confirmDryRun")}</p>
        ) : overwrite ? (
          <p className={styles.confirmNote}>{t("restore.confirmOverwrite")}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

export default RestorePage
