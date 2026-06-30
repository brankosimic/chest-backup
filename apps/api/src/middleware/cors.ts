import type { Context, Next } from "hono"

const cors = (c: Context, next: Next) => {
  c.header("Access-Control-Allow-Origin", "*")
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (c.req.method === "OPTIONS") {
    return c.text("", 204)
  }

  return next()
}

export { cors }
