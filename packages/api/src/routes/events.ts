import { Hono } from "hono"
import { subscribe } from "../lib/event-bus"
import { getActiveRun } from "../lib/progress"

const events = new Hono()

const HEARTBEAT_MS = 20_000

const formatFrame = (event: string, data: unknown): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

interface StreamState {
  encoder: TextEncoder
  controller: ReadableStreamDefaultController<Uint8Array> | null
  cleanup: (() => void) | null
}

const sendChunk = (state: StreamState, chunk: string): void => {
  if (!state.controller) return
  try {
    state.controller.enqueue(state.encoder.encode(chunk))
  } catch (err) {
    console.error("failed to enqueue stream chunk", err)
    state.cleanup?.()
  }
}

const createStream = (): ReadableStream<Uint8Array> => {
  const state: StreamState = { encoder: new TextEncoder(), controller: null, cleanup: null }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      state.controller = controller

      const unsubscribe = subscribe((event) => {
        if (event.type === "log") sendChunk(state, formatFrame("log", { entry: event.entry }))
        if (event.type === "run") sendChunk(state, formatFrame("run", { run: event.run }))
      })

      const heartbeat = setInterval(() => {
        sendChunk(state, formatFrame("ping", { at: new Date().toISOString() }))
      }, HEARTBEAT_MS)

      state.cleanup = () => {
        clearInterval(heartbeat)
        unsubscribe()
      }

      sendChunk(state, "retry: 3000\n\n")
      sendChunk(state, formatFrame("hello", { at: new Date().toISOString() }))

      const active = getActiveRun()
      if (active) sendChunk(state, formatFrame("run", { run: active }))
    },
    cancel() {
      state.cleanup?.()
    },
  })
}

events.get("/stream", () => {
  return new Response(createStream(), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
})

export { events }
