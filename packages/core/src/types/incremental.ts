import type { DiffResult, Manifest } from "./manifest"

interface IncrementalPrep {
  diff: DiffResult
  manifest: Manifest
}

export type { IncrementalPrep }
