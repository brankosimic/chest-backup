import { RunStatus } from "../types/enums"

interface DeriveRunStatusInput {
  success: boolean
  results: { success: boolean; skipped?: boolean }[]
}

/**
 * Derives the run status from the overall result and the per-destination outcomes.
 * - every destination skipped  -> skipped (nothing to upload)
 * - all destinations succeeded -> success
 * - some succeeded, some failed -> partial
 * - everything failed           -> failed
 */
const deriveRunStatus = (input: DeriveRunStatusInput): RunStatus => {
  const results = input.results
  if (results.length > 0 && results.every((r) => r.skipped)) return RunStatus.Skipped
  if (input.success) return RunStatus.Success
  if (results.some((r) => r.success)) return RunStatus.Partial
  return RunStatus.Failed
}

export { deriveRunStatus }
export type { DeriveRunStatusInput }
