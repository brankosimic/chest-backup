import type { Result } from "../types/api"
import type { Context } from "hono"
import type { ZodType } from "zod"

const validateBody = async <T>(schema: ZodType<T>, c: Context): Promise<Result<T>> => {
  const body = (await c.req.json())
  const result = schema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      error: c.json(
        { success: false, error: "Validation failed", message: result.error.issues[0]?.message },
        400,
      ),
    }
  }

  return { ok: true, data: result.data }
}

const notFound = (c: Context, label: string): Response =>
  c.json({ success: false, error: `${label} not found` }, 404)

export { notFound, validateBody }
