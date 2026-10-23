import { AsyncLocalStorage } from "node:async_hooks"
import { Writable } from "node:stream"
import pino from "pino"
import { logLevel } from "../env"

interface LogRecord {
  level: number
  time?: number
  msg?: string
  [key: string]: unknown
}

type LogSink = (record: LogRecord) => void

const sinks = new Set<LogSink>()
const runContext = new AsyncLocalStorage<{ runId: string }>()

const notifySink = (sink: LogSink, record: LogRecord): void => {
  try {
    sink(record)
  } catch (err) {
    console.error("log sink failed", err)
  }
}

const notifySinks = (record: LogRecord): void => {
  sinks.forEach((sink) => {
    notifySink(sink, record)
  })
}

const handleLine = (line: string): void => {
  if (!line.trim()) return

  try {
    notifySinks(JSON.parse(line) as LogRecord)
  } catch (err) {
    console.error("failed to parse log record", err)
  }
}

const output = new Writable({
  write(chunk: Buffer, _encoding, callback) {
    process.stdout.write(chunk)
    chunk
      .toString()
      .split("\n")
      .forEach(handleLine)
    callback()
  },
})

const logger = pino({ level: logLevel }, output)

const subscribeToLogs = (sink: LogSink): (() => void) => {
  sinks.add(sink)
  return () => {
    sinks.delete(sink)
  }
}

const withRunContext = <T>(runId: string, fn: () => T): T => runContext.run({ runId }, fn)

const currentRunId = (): string | undefined => runContext.getStore()?.runId

export { logger, subscribeToLogs, withRunContext, currentRunId, type LogRecord, type LogSink }
