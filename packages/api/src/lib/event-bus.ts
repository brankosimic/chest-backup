import type { LogEntry } from "@chest-backup/shared"
import type { RunSnapshot } from "../types/run"

type StreamEvent =
  | { type: "log"; entry: LogEntry }
  | { type: "run"; run: RunSnapshot }
  | { type: "hello"; at: string }
  | { type: "ping"; at: string }

type StreamListener = (event: StreamEvent) => void

const listeners = new Set<StreamListener>()

const deliver = (listener: StreamListener, event: StreamEvent): void => {
  try {
    listener(event)
  } catch (err) {
    console.error("failed to deliver stream event", err)
  }
}

const publish = (event: StreamEvent): void => {
  listeners.forEach((listener) => {
    deliver(listener, event)
  })
}

const subscribe = (listener: StreamListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export { publish, subscribe, type StreamEvent, type StreamListener }
