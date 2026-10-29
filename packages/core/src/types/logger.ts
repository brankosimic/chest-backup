interface LogRecord {
  level: number
  time?: number
  msg?: string
  [key: string]: unknown
}

type LogSink = (record: LogRecord) => void

export type { LogRecord, LogSink }
