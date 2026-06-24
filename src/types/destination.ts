import type { Destination } from "./config"

interface StoreResult {
  success: boolean
  error?: string
  durationMs?: number
  destLabel?: string
}

interface DestinationHandler {
  store(archivePath: string, dest: Destination): Promise<StoreResult>
  prune(dest: Destination, prefix: string, globalRetention: number): Promise<void>
}

export type { DestinationHandler, StoreResult }
