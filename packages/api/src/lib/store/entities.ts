import { existsSync, statSync } from "node:fs"
import type { Source, Destination } from "@chest-backup/shared"
import type { ConfigFile, SourceEntry, SourceWriteResult } from "../../types/store"
import { FlatSourceType, SourceOrigin, SourceWriteError } from "../../types/store"
import { getConfig, writeConfig, stableId, now } from "./config"

const detectPathType = (path: string): boolean => {
  if (!existsSync(path)) return false
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

const sourceKey = (item: Record<string, unknown>): Record<string, unknown> => {
  const type = item.type as string
  if (type === FlatSourceType.Path || type === FlatSourceType.Sqlite) return { type, path: item.path }
  return item
}

const sourceId = (origin: SourceOrigin, item: Record<string, unknown>): string =>
  stableId({ origin, ...sourceKey(item) })

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

const collectSourceEntries = (config: ConfigFile): SourceEntry[] => {
  const pathEntries = (config.paths ?? []).map((path, index) => ({
    id: sourceId(SourceOrigin.Paths, { type: FlatSourceType.Path, path }),
    origin: SourceOrigin.Paths,
    index,
    item: { type: FlatSourceType.Path, path },
  }))

  const sqliteEntries = (config.sqlite ?? []).map((path, index) => ({
    id: sourceId(SourceOrigin.Sqlite, { type: FlatSourceType.Sqlite, path }),
    origin: SourceOrigin.Sqlite,
    index,
    item: { type: FlatSourceType.Sqlite, path },
  }))

  const sourceEntries = (config.sources ?? []).map((item, index) => ({
    id: sourceId(SourceOrigin.Sources, item),
    origin: SourceOrigin.Sources,
    index,
    item,
  }))

  return [...pathEntries, ...sqliteEntries, ...sourceEntries]
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

const removeSourceEntry = (config: ConfigFile, entry: SourceEntry): void => {
  if (entry.origin === SourceOrigin.Paths) {
    const paths = [...(config.paths ?? [])]
    paths.splice(entry.index, 1)
    config.paths = paths
    return
  }
  if (entry.origin === SourceOrigin.Sqlite) {
    const sqlite = [...(config.sqlite ?? [])]
    sqlite.splice(entry.index, 1)
    config.sqlite = sqlite
    return
  }
  const sources = [...(config.sources ?? [])]
  sources.splice(entry.index, 1)
  config.sources = sources
}

const containerForType = (type: string): SourceOrigin => {
  if (type === FlatSourceType.Path) return SourceOrigin.Paths
  if (type === FlatSourceType.Sqlite) return SourceOrigin.Sqlite
  return SourceOrigin.Sources
}

const insertSourceItem = (config: ConfigFile, origin: SourceOrigin, item: Record<string, unknown>): void => {
  if (origin === SourceOrigin.Paths) {
    config.paths = [...(config.paths ?? []), String(item.path)]
    return
  }
  if (origin === SourceOrigin.Sqlite) {
    config.sqlite = [...(config.sqlite ?? []), String(item.path)]
    return
  }
  config.sources = [...(config.sources ?? []), { ...item }]
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

const buildNextItem = (entry: SourceEntry, data: Partial<Source>): Record<string, unknown> => {
  const currentType = String(entry.item.type)
  const nextType = data.type ?? currentType

  if (nextType === FlatSourceType.Path || nextType === FlatSourceType.Sqlite) {
    return { type: nextType, path: String(data.path ?? entry.item.path) }
  }
  if (nextType !== currentType) return { ...data, type: nextType }
  return { ...entry.item, ...data }
}

const replaceSourceItem = (config: ConfigFile, origin: SourceOrigin, index: number, item: Record<string, unknown>): void => {
  if (origin === SourceOrigin.Paths) {
    const paths = [...(config.paths ?? [])]
    paths[index] = String(item.path)
    config.paths = paths
    return
  }
  if (origin === SourceOrigin.Sqlite) {
    const sqlite = [...(config.sqlite ?? [])]
    sqlite[index] = String(item.path)
    config.sqlite = sqlite
    return
  }
  const sources = [...(config.sources ?? [])]
  sources[index] = item
  config.sources = sources
}

const applySourceUpdate = (
  config: ConfigFile,
  entry: SourceEntry,
  target: SourceOrigin,
  item: Record<string, unknown>,
): void => {
  if (target === entry.origin) {
    replaceSourceItem(config, target, entry.index, item)
    return
  }
  removeSourceEntry(config, entry)
  insertSourceItem(config, target, item)
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

  applySourceUpdate(config, entry, target, nextItem)
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

const destinationId = (item: Record<string, unknown>): string =>
  (item.id as string | undefined) ?? stableId(item)

const destinationFromConfigItem = (item: Record<string, unknown>): Destination => ({
  type: item.type as Destination["type"],
  path: item.path as string,
  ...item,
  id: destinationId(item),
  createdAt: now(),
  updatedAt: now(),
})

const getDestinations = (): Destination[] => {
  const { config } = getConfig()
  return config.destinations.map(destinationFromConfigItem)
}

const findDestinationById = (id: string): Destination | undefined => getDestinations().find((d) => d.id === id)

const createDestination = (data: Record<string, unknown>): Destination => {
  const { config } = getConfig()
  const item = { ...data, id: (data.id as string | undefined) ?? stableId(data) }
  config.destinations.push(item as unknown as ConfigFile["destinations"][number])
  writeConfig(config)
  return destinationFromConfigItem(item)
}

const updateDestination = (id: string, data: Partial<Destination>): Destination | undefined => {
  const { config } = getConfig()
  const index = config.destinations.findIndex((d) => destinationId(d) === id)
  if (index === -1) return undefined
  const current = config.destinations[index]
  config.destinations[index] = { ...current, ...data, id: current.id ?? id }
  writeConfig(config)
  return destinationFromConfigItem(config.destinations[index])
}

const deleteDestination = (id: string): boolean => {
  const { config } = getConfig()
  const index = config.destinations.findIndex((d) => destinationId(d) === id)
  if (index === -1) return false
  config.destinations.splice(index, 1)
  writeConfig(config)
  return true
}

export {
  getSources,
  findSourceById,
  createSource,
  updateSource,
  deleteSource,
  getDestinations,
  findDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
}
