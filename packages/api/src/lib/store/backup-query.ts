import type { BackupRecord } from "@chest-backup/shared"
import { RunSort } from "../../types/query"
import type { BackupQuery } from "../../types/query"
import type { PaginatedResult } from "../../types/api"

const matchesSearch = (record: BackupRecord, needle: string): boolean => {
  const haystacks = [record.id, record.runId, record.archiveName ?? "", ...record.errors, ...record.destinationResults.flatMap((result) => [result.destName ?? "", result.destPath ?? ""])]
  return haystacks.some((value) => value.toLowerCase().includes(needle))
}

const isWithinRange = (record: BackupRecord, query: BackupQuery): boolean => {
  const started = Date.parse(record.startedAt)
  const from = query.from ? Date.parse(query.from) : Number.NaN
  const to = query.to ? Date.parse(query.to) : Number.NaN
  return (Number.isNaN(from) || started >= from) && (Number.isNaN(to) || started <= to)
}

const matchesDestination = (record: BackupRecord, destinationId: string): boolean =>
  record.destinationResults.some((result) => result.destId === destinationId || result.destPath === destinationId)

const compareRuns = (sort: BackupQuery["sort"]): ((a: BackupRecord, b: BackupRecord) => number) => {
  if (sort === RunSort.Oldest) return (a, b) => a.startedAt.localeCompare(b.startedAt)
  if (sort === RunSort.Duration) return (a, b) => b.durationMs - a.durationMs
  if (sort === RunSort.Size) return (a, b) => (b.totalUploadedBytes ?? 0) - (a.totalUploadedBytes ?? 0)
  return (a, b) => b.startedAt.localeCompare(a.startedAt)
}

const applyQuery = (records: BackupRecord[], query: BackupQuery): BackupRecord[] => {
  const needle = query.search?.toLowerCase()

  return records
    .filter((record) => !query.status || record.status === query.status)
    .filter((record) => !query.trigger || record.trigger === query.trigger)
    .filter((record) => !query.destinationId || matchesDestination(record, query.destinationId))
    .filter((record) => isWithinRange(record, query))
    .filter((record) => !needle || matchesSearch(record, needle))
    .sort(compareRuns(query.sort))
}

const paginate = <T>(items: T[], page: number, limit: number): PaginatedResult<T> => ({
  data: items.slice((page - 1) * limit, (page - 1) * limit + limit),
  total: items.length,
  page,
  limit,
})

export { applyQuery, paginate }
