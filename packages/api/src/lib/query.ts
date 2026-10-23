import type { Context } from "hono"
import { LogLevel, RunStatus, RunTrigger } from "@chest-backup/shared"
import { RunSort } from "../types/query"
import type { BackupQuery, LogQuery } from "../types/query"

const RUN_STATUS_BY_VALUE = new Map<string, RunStatus>(Object.values(RunStatus).map((status) => [status, status]))
const RUN_TRIGGER_BY_VALUE = new Map<string, RunTrigger>(Object.values(RunTrigger).map((trigger) => [trigger, trigger]))
const LOG_LEVEL_BY_VALUE = new Map<string, LogLevel>(Object.values(LogLevel).map((level) => [level, level]))
const RUN_SORT_BY_VALUE = new Map<string, RunSort>(Object.values(RunSort).map((sort) => [sort, sort]))

const toNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const parseRunQuery = (c: Context): BackupQuery => {
  const params = new URL(c.req.url).searchParams
  const status = params.get("status")
  const trigger = params.get("trigger")
  const sort = params.get("sort")

  return {
    page: toNumber(params.get("page"), 1),
    limit: toNumber(params.get("limit"), 20),
    status: status ? RUN_STATUS_BY_VALUE.get(status) : undefined,
    trigger: trigger ? RUN_TRIGGER_BY_VALUE.get(trigger) : undefined,
    destinationId: params.get("destinationId") ?? undefined,
    search: params.get("search") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sort: sort ? RUN_SORT_BY_VALUE.get(sort) : undefined,
  }
}

const parseLogQuery = (c: Context): LogQuery => {
  const params = new URL(c.req.url).searchParams
  const level = params.get("level")
  const levels = (params.get("levels") ?? "")
    .split(",")
    .map((value) => LOG_LEVEL_BY_VALUE.get(value))
    .filter((value): value is LogLevel => !!value)

  return {
    level: level ? LOG_LEVEL_BY_VALUE.get(level) : undefined,
    levels: levels.length ? levels : undefined,
    search: params.get("search") ?? undefined,
    runId: params.get("runId") ?? undefined,
    since: params.get("since") ?? undefined,
    page: toNumber(params.get("page"), 1),
    limit: toNumber(params.get("limit"), 100),
  }
}

export { parseRunQuery, parseLogQuery }
