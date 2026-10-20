import { SourceErrorCode } from "@chest-backup/shared"
import type { Result } from "../types/api"
import type { Context } from "hono"
import type { ZodType } from "zod"
import { SourceWriteError } from "../types/store"

const validateBody = async <T>(schema: ZodType<T>, c: Context): Promise<Result<T>> => {
  const body: Record<string, unknown> = await c.req.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      error: c.json({ success: false, error: "Validation failed", message: result.error.issues[0]?.message }, 400),
    }
  }

  return { ok: true, data: result.data }
}

const notFound = (c: Context, label: string): Response => c.json({ success: false, error: `${label} not found` }, 404)

const sourceWriteError = (c: Context, error: SourceWriteError): Response =>
  error === SourceWriteError.Duplicate
    ? c.json({ success: false, error: "Duplicate source", code: SourceErrorCode.Duplicate }, 409)
    : notFound(c, "Source")

export { notFound, sourceWriteError, validateBody }
