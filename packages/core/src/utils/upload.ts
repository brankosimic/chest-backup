import { UploadOutcomeKind } from "../types/destination"
import type { FileUploadResult, UploadOutcome } from "../types/destination"

const RETRYABLE_CODES = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAGAIN"]

const errorCode = (err: unknown): string | undefined =>
  err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined

const isRetryable = (err: unknown): boolean => {
  const code = errorCode(err)
  return code !== undefined && RETRYABLE_CODES.includes(code)
}

const partitionByOutcome = (results: FileUploadResult[]): Pick<UploadOutcome, "uploaded" | "failed" | "vanished"> => ({
  uploaded: results.filter((r) => r.outcome === UploadOutcomeKind.Uploaded).map((r) => r.path),
  failed: results.filter((r) => r.outcome === UploadOutcomeKind.Failed).map((r) => r.path),
  vanished: results.filter((r) => r.outcome === UploadOutcomeKind.Vanished).map((r) => r.path),
})

const speedFrom = (bytes: number, durationMs: number): number => (durationMs > 0 ? bytes / (durationMs / 1000) : 0)

export { errorCode, isRetryable, partitionByOutcome, speedFrom }
