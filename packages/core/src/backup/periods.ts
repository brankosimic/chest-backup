import { RetentionMode } from "../types/config"

const MONTH_PATTERN = /^\d{4}-\d{2}$/
const WEEK_PATTERN = /^\d{4}-W\d{2}$/

const pad2 = (value: number): string => String(value).padStart(2, "0")

const isoWeekKeyFor = (date: Date): string => {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayOfWeek = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)

  return `${String(utc.getUTCFullYear())}-W${pad2(week)}`
}

const periodKeyFor = (mode: RetentionMode, timestamp: string, date: Date): string => {
  if (mode === RetentionMode.Weekly) return isoWeekKeyFor(date)
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}`
}

const isPeriodKey = (mode: RetentionMode, name: string): boolean =>
  mode === RetentionMode.Weekly ? WEEK_PATTERN.test(name) : MONTH_PATTERN.test(name)

const sortPeriodKeysDesc = (keys: string[]): string[] => [...keys].sort().reverse()

const selectExpiredPeriodKeys = (existing: string[], keep: number, current: string, isPeriod: (name: string) => boolean): string[] =>
  sortPeriodKeysDesc(existing.filter((key) => isPeriod(key) && key !== current)).slice(Math.max(keep - 1, 0))

export { isoWeekKeyFor, periodKeyFor, isPeriodKey, sortPeriodKeysDesc, selectExpiredPeriodKeys }