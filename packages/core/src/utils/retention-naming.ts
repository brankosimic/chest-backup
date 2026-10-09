const MS_PER_DAY = 86_400_000
const TIMESTAMP_PATTERN = /(\d{8}-\d{6})/

const basename = (path: string): string => path.split("/").pop() ?? ""

const parseTimestampFromName = (name: string): string | null => TIMESTAMP_PATTERN.exec(name)?.[1] ?? null

const ageDays = (name: string): number | null => {
  const ts = parseTimestampFromName(name)
  if (!ts) return null
  const iso = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(9, 11)}:${ts.slice(11, 13)}:${ts.slice(13, 15)}`
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return null
  return (Date.now() - parsed) / MS_PER_DAY
}

export { basename, parseTimestampFromName, ageDays }
