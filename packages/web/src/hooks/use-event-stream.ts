import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LogEntry } from "@chest-backup/shared"
import type { BackupRunProgress } from "@/types/backup"
import type { StreamState } from "@/types/activity"

const MAX_LIVE_LOGS = 3000
const RECONNECT_MS = 3000

const parseFrame = (event: MessageEvent<string>): unknown => {
  try {
    return JSON.parse(event.data) as unknown
  } catch (err) {
    console.error("failed to parse stream frame", err)
    return null
  }
}

const useEventStream = (enabled = true): StreamState => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [run, setRun] = useState<BackupRunProgress | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastEventAt, setLastEventAt] = useState<string | null>(null)
  const sourceRef = useRef<EventSource | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    let disposed = false

    const handleLog = (event: MessageEvent<string>): void => {
      const payload = parseFrame(event) as { entry?: LogEntry } | null
      const entry = payload?.entry
      if (!entry) return

      setLogs((previous) => {
        const next = [...previous, entry]
        return next.length > MAX_LIVE_LOGS ? next.slice(next.length - MAX_LIVE_LOGS) : next
      })
      setLastEventAt(entry.timestamp)
    }

    const handleRun = (event: MessageEvent<string>): void => {
      const payload = parseFrame(event) as { run?: BackupRunProgress } | null
      if (payload?.run) setRun(payload.run)
    }

    const connect = (): void => {
      if (disposed) return

      const source = new EventSource("/api/events/stream")
      sourceRef.current = source
      source.addEventListener("hello", () => {
        setConnected(true)
      })
      source.addEventListener("log", handleLog as EventListener)
      source.addEventListener("run", handleRun as EventListener)
      source.onopen = () => {
        setConnected(true)
      }
      source.onerror = () => {
        setConnected(false)
        source.close()
        retryRef.current = setTimeout(connect, RECONNECT_MS)
      }
    }

    connect()

    return () => {
      disposed = true
      if (retryRef.current) clearTimeout(retryRef.current)
      sourceRef.current?.close()
      sourceRef.current = null
      setConnected(false)
    }
  }, [enabled])

  const reset = useCallback(() => {
    setLogs([])
  }, [])

  return useMemo(() => ({ logs, run, connected, lastEventAt, reset }), [logs, run, connected, lastEventAt, reset])
}

export { useEventStream }
