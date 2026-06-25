import type { Destination } from "./config"

interface StoreResult {
  success: boolean
  error?: string
  durationMs?: number
  destLabel?: string
  speed?: number
}

type UploadProgress = {
  uploadedSize: number
  durationMs: number
  speed: number
}

interface DestinationHandler {
  store(archivePath: string, dest: Destination): Promise<StoreResult>
  prune(dest: Destination, prefix: string, globalRetention: number): Promise<void>
}

export type { DestinationHandler, StoreResult, UploadProgress }
