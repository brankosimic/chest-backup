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

interface StreamCallbacks {
  onLog: (entry: LogEntry) => void
  onRun: (run: BackupRunProgress) => void
  onConnect: () => void
  onDisconnect: () => void
}

interface StreamRefs {
  source: React.RefObject<EventSource | null>
  retry: React.RefObject<ReturnType<typeof setTimeout> | null>
}

const handleLogEvent = (event: MessageEvent<string>, callbacks: StreamCallbacks): void => {
  const payload = parseFrame(event) as { entry?: LogEntry } | null
  const entry = payload?.entry
  if (!entry) return
  callbacks.onLog(entry)
}

const handleRunEvent = (event: MessageEvent<string>, callbacks: StreamCallbacks): void => {
  const payload = parseFrame(event) as { run?: BackupRunProgress } | null
  if (payload?.run) callbacks.onRun(payload.run)
}

const connectStream = (refs: StreamRefs, callbacks: StreamCallbacks): void => {
  const source = new EventSource("/api/events/stream")
  refs.source.current = source
  source.addEventListener("hello", () => {
    callbacks.onConnect()
  })
  source.addEventListener("log", ((e: MessageEvent<string>) => {
    handleLogEvent(e, callbacks)
  }) as EventListener)
  source.addEventListener("run", ((e: MessageEvent<string>) => {
    handleRunEvent(e, callbacks)
  }) as EventListener)
  source.onopen = () => {
    callbacks.onConnect()
  }
  source.onerror = () => {
    callbacks.onDisconnect()
    source.close()
    refs.retry.current = setTimeout(() => {
      connectStream(refs, callbacks)
    }, RECONNECT_MS)
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

    const callbacks: StreamCallbacks = {
      onLog: (entry) => {
        setLogs((previous) => {
          const next = [...previous, entry]
          return next.length > MAX_LIVE_LOGS ? next.slice(next.length - MAX_LIVE_LOGS) : next
        })
        setLastEventAt(entry.timestamp)
      },
      onRun: (nextRun) => {
        setRun(nextRun)
      },
      onConnect: () => {
        setConnected(true)
      },
      onDisconnect: () => {
        setConnected(false)
      },
    }

    connectStream({ source: sourceRef, retry: retryRef }, callbacks)

    return () => {
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
