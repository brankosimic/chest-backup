import { existsSync, statSync } from "node:fs"
import type { Source } from "@chest-backup/shared"
import type { ConfigFile, SourceWriteResult } from "../../types/store"
import { FlatSourceType, SourceOrigin, SourceWriteError } from "../../types/store"
import { getConfig, writeConfig, now } from "./config"
import { sourceId, collectSourceEntries, removeSourceEntry, containerForType, insertSourceItem } from "./source-entries"

const detectPathType = (path: string): boolean => {
  if (!existsSync(path)) return false
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

const sourceFromConfigItem = (origin: SourceOrigin, item: Record<string, unknown>): Source => {
  const source = {
    ...item,
    id: sourceId(origin, item),
    type: item.type as Source["type"],
    createdAt: now(),
    updatedAt: now(),
  } as Source

  const path = source.path
  if (source.type === FlatSourceType.Path && source.isFile === undefined && path !== undefined) {
    source.isFile = detectPathType(path)
  }

  return source
}

const getSources = (): Source[] => {
  const { config } = getConfig()
  return collectSourceEntries(config).map((entry) => sourceFromConfigItem(entry.origin, entry.item))
}

const findSourceById = (id: string): Source | undefined => {
  const { config } = getConfig()
  const entry = collectSourceEntries(config).find((e) => e.id === id)
  return entry ? sourceFromConfigItem(entry.origin, entry.item) : undefined
}

const isDuplicate = (config: ConfigFile, origin: SourceOrigin, path: string, skipIndex: number): boolean => {
  if (origin === SourceOrigin.Paths) return (config.paths ?? []).some((p, i) => i !== skipIndex && p === path)
  if (origin === SourceOrigin.Sqlite) return (config.sqlite ?? []).some((p, i) => i !== skipIndex && p === path)
  return false
}

const createSource = (data: Record<string, unknown>): SourceWriteResult => {
  const { config } = getConfig()
  const type = String(data.type)
  const item =
    type === FlatSourceType.Path || type === FlatSourceType.Sqlite ? { type, path: String(data.path) } : { ...data }
  const origin = containerForType(type)

  if (origin !== SourceOrigin.Sources && isDuplicate(config, origin, String(item.path), -1)) {
    return { ok: false, error: SourceWriteError.Duplicate }
  }

  insertSourceItem(config, origin, item)
  writeConfig(config)
  return { ok: true, source: sourceFromConfigItem(origin, item) }
}

const buildNextItem = (entry: { item: Record<string, unknown> }, data: Partial<Source>): Record<string, unknown> => {
  const currentType = String(entry.item.type)
  const nextType = data.type ?? currentType

  if (nextType === FlatSourceType.Path || nextType === FlatSourceType.Sqlite) {
    return { type: nextType, path: String(data.path ?? entry.item.path) }
  }
  if (nextType !== currentType) return { ...data, type: nextType }
  return { ...entry.item, ...data }
}

const updateSource = (id: string, data: Partial<Source>): SourceWriteResult => {
  const { config } = getConfig()
  const entry = collectSourceEntries(config).find((e) => e.id === id)
  if (!entry) return { ok: false, error: SourceWriteError.NotFound }

  const nextItem = buildNextItem(entry, data)
  const typeChanged = String(nextItem.type) !== String(entry.item.type)
  const target = typeChanged ? containerForType(String(nextItem.type)) : entry.origin
  const skipIndex = target === entry.origin ? entry.index : -1

  if (target !== SourceOrigin.Sources && isDuplicate(config, target, String(nextItem.path), skipIndex)) {
    return { ok: false, error: SourceWriteError.Duplicate }
  }

  removeSourceEntry(config, entry)
  insertSourceItem(config, target, nextItem)
  writeConfig(config)
  return { ok: true, source: sourceFromConfigItem(target, nextItem) }
}

const deleteSource = (id: string): boolean => {
  const { config } = getConfig()
  const entry = collectSourceEntries(config).find((e) => e.id === id)
  if (!entry) return false
  removeSourceEntry(config, entry)
  writeConfig(config)
  return true
}

export { getSources, findSourceById, createSource, updateSource, deleteSource }
