import type { Context } from "hono"
import type { ZodType } from "zod"

interface BunRequest extends Request {
  jsonSync(): unknown
}

type JsonData = Record<string, unknown>

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: Response }

const validateBody = <T>(schema: ZodType<T>, c: Context): Result<T> => {
  const body = (c.req.raw as BunRequest).jsonSync() as JsonData
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
