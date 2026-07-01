import type { Destination } from "./config"
import type { StoreResult } from "@chest-backup/shared"

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
