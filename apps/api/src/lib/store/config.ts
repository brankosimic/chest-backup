import { readFileSync, writeFileSync, statSync } from "node:fs"
import { resolve, dirname } from "node:path"
import type { CachedConfig, ConfigFile } from "../../types/store"

const CONFIG_PATH = process.env.CHEST_CONFIG_PATH ?? resolve(process.cwd(), "chest-backup.json")
const DATA_DIR = process.env.CHEST_DATA_DIR ?? resolve(dirname(CONFIG_PATH), ".chest-data")
const BACKUP_HISTORY_PATH = resolve(DATA_DIR, "backup-history.json")

let cachedConfig: CachedConfig | null = null

const getConfig = (): CachedConfig => {
  const st = statSync(CONFIG_PATH)
  if (cachedConfig && cachedConfig.mtime === st.mtimeMs) return cachedConfig
  const raw = readFileSync(CONFIG_PATH, "utf-8")
  const config = JSON.parse(raw) as ConfigFile
  cachedConfig = { config, mtime: st.mtimeMs, raw }
  return cachedConfig
}

const writeConfig = (config: ConfigFile): void => {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n")
  cachedConfig = null
}

const stableId = (obj: Record<string, unknown>): string => {
  const hash = Number(Bun.hash(JSON.stringify(obj)))
  return Math.abs(hash).toString(36)
}

const now = (): string => new Date().toISOString()

export { getConfig, writeConfig, stableId, now, CONFIG_PATH, DATA_DIR, BACKUP_HISTORY_PATH }
