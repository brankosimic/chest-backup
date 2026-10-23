import { Hono } from "hono"
import { subscribe } from "../lib/event-bus"
import { getActiveRun } from "../lib/progress"

const events = new Hono()

const HEARTBEAT_MS = 20_000

const formatFrame = (event: string, data: unknown): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

const createStream = (): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string): void => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch (err) {
          console.error("failed to enqueue stream chunk", err)
          cleanup?.()
        }
      }

      const unsubscribe = subscribe((event) => {
        if (event.type === "log") send(formatFrame("log", { entry: event.entry }))
        if (event.type === "run") send(formatFrame("run", { run: event.run }))
      })

      const heartbeat = setInterval(() => {
        send(formatFrame("ping", { at: new Date().toISOString() }))
      }, HEARTBEAT_MS)

      cleanup = () => {
        clearInterval(heartbeat)
        unsubscribe()
      }

      send("retry: 3000\n\n")
      send(formatFrame("hello", { at: new Date().toISOString() }))

      const active = getActiveRun()
      if (active) send(formatFrame("run", { run: active }))
    },
    cancel() {
      cleanup?.()
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
