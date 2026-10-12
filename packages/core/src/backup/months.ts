const MONTH_PATTERN = /^\d{4}-\d{2}$/

// One snapshot folder per calendar month. Within a month the manifest keeps the
// smart-copy behaviour; crossing into a new month starts a fresh, complete snapshot.
const monthKeyFor = (timestamp: string): string => `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}`

const isMonthKey = (name: string): boolean => MONTH_PATTERN.test(name)

const sortMonthKeysDesc = (keys: string[]): string[] => [...keys].sort().reverse()

const selectExpiredMonthKeys = (existing: string[], keep: number, current: string): string[] =>
  sortMonthKeysDesc(existing.filter((k) => isMonthKey(k) && k !== current)).slice(Math.max(keep - 1, 0))

export { monthKeyFor, isMonthKey, sortMonthKeysDesc, selectExpiredMonthKeys }