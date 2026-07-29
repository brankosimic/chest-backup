import type { Context, Next } from "hono"

const errorHandling = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    const status = err instanceof Error && err.message.includes("Validation failed") ? 400 : 500
    return c.json({ success: false, error: message }, status)
  }
}

export { errorHandling }
