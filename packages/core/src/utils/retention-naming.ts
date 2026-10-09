const TIMESTAMP_PATTERN = /(\d{8}-\d{6})/

const basename = (path: string): string => path.split("/").pop() ?? ""

const parseTimestampFromName = (name: string): string | null => TIMESTAMP_PATTERN.exec(name)?.[1] ?? null

export { basename, parseTimestampFromName }