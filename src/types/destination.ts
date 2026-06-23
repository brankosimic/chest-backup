import type { Destination } from "./config"

interface StoreResult {
  success: boolean
  error?: string
  durationMs?: number
}

interface DestinationHandler {
  store(archivePath: string, dest: Destination): Promise<StoreResult>
  prune(dest: Destination, prefix: string, globalRetention: number): Promise<void>
}

export type { DestinationHandler, StoreResult }
