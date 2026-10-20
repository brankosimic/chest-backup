import { existsSync, statSync } from "node:fs"
import type { Source, Destination } from "@chest-backup/shared"
import type { ConfigFile } from "../../types/store"
import { getConfig, writeConfig, stableId, now } from "./config"

const detectPathType = (path: string): boolean => {
  if (!existsSync(path)) return false
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

type SourceOrigin = "paths" | "sqlite" | "sources"

interface SourceEntry {
  id: string
  origin: SourceOrigin
  index: number
  item: Record<string, unknown>
}

const sourceKey = (item: Record<string, unknown>): Record<string, unknown> => {
  const type = item.type as string
  if (type === "path" || type === "sqlite") return { type, path: item.path }
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

  if (source.type === "path" && !("isFile" in source) && "path" in source) {
    ;(source as { isFile?: boolean }).isFile = detectPathType(source.path as string)
  }

  return source
}

const collectSourceEntries = (config: ConfigFile): SourceEntry[] => {
  const pathEntries = (config.paths ?? []).map((path, index) => ({
    id: sourceId("paths", { type: "path", path }),
    origin: "paths" as const,
    index,
    item: { type: "path", path },
  }))

  const sqliteEntries = (config.sqlite ?? []).map((path, index) => ({
    id: sourceId("sqlite", { type: "sqlite", path }),
    origin: "sqlite" as const,
    index,
    item: { type: "sqlite", path },
  }))

  const sourceEntries = (config.sources ?? []).map((item, index) => ({
    id: sourceId("sources", item),
    origin: "sources" as const,
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
  if (entry.origin === "paths") {
    const paths = [...(config.paths ?? [])]
    paths.splice(entry.index, 1)
    config.paths = paths
    return
  }
  if (entry.origin === "sqlite") {
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
  if (type === "path") return "paths"
  if (type === "sqlite") return "sqlite"
  return "sources"
}

const insertSourceItem = (config: ConfigFile, origin: SourceOrigin, item: Record<string, unknown>): void => {
  if (origin === "paths") {
    config.paths = [...(config.paths ?? []), String(item.path)]
    return
  }
  if (origin === "sqlite") {
    config.sqlite = [...(config.sqlite ?? []), String(item.path)]
    return
  }
  config.sources = [...(config.sources ?? []), { ...item }]
}

const isDuplicate = (config: ConfigFile, origin: SourceOrigin, path: string, skipIndex: number): boolean => {
  if (origin === "paths") return (config.paths ?? []).some((p, i) => i !== skipIndex && p === path)
  if (origin === "sqlite") return (config.sqlite ?? []).some((p, i) => i !== skipIndex && p === path)
  return false
}

class DuplicateSourceError extends Error {
  constructor(path: string) {
    super(`Source already exists: ${path}`)
    this.name = "DuplicateSourceError"
  }
}

const createSource = (data: Record<string, unknown>): Source => {
  const { config } = getConfig()
  const type = String(data.type)
  const item = type === "path" || type === "sqlite" ? { type, path: String(data.path) } : { ...data }
  const origin = containerForType(type)

  if (origin !== "sources" && isDuplicate(config, origin, String(item.path), -1)) {
    throw new DuplicateSourceError(String(item.path))
  }

  insertSourceItem(config, origin, item)
  writeConfig(config)
  return sourceFromConfigItem(origin, item)
}

const updateSource = (id: string, data: Partial<Source>): Source | undefined => {
  const { config } = getConfig()
  const entry = collectSourceEntries(config).find((e) => e.id === id)
  if (!entry) return undefined

  const currentType = String(entry.item.type)
  const nextType = data.type !== undefined ? data.type : currentType
  const typeChanged = nextType !== currentType

  const nextItem: Record<string, unknown> =
    nextType === "path" || nextType === "sqlite"
      ? { type: nextType, path: String(data.path ?? entry.item.path) }
      : typeChanged
        ? { ...data, type: nextType }
        : { ...entry.item, ...data }

  const target = typeChanged ? containerForType(nextType) : entry.origin

  if (target !== "sources" && isDuplicate(config, target, String(nextItem.path), target === entry.origin ? entry.index : -1)) {
    throw new DuplicateSourceError(String(nextItem.path))
  }

  if (target === entry.origin) {
    if (target === "paths") {
      const paths = [...(config.paths ?? [])]
      paths[entry.index] = String(nextItem.path)
      config.paths = paths
    } else if (target === "sqlite") {
      const sqlite = [...(config.sqlite ?? [])]
      sqlite[entry.index] = String(nextItem.path)
      config.sqlite = sqlite
    } else {
      const sources = [...(config.sources ?? [])]
      sources[entry.index] = nextItem
      config.sources = sources
    }
  } else {
    removeSourceEntry(config, entry)
    insertSourceItem(config, target, nextItem)
  }

  writeConfig(config)
  return sourceFromConfigItem(target, nextItem)
}

const deleteSource = (id: string): boolean => {
  const { config } = getConfig()
  const entry = collectSourceEntries(config).find((e) => e.id === id)
  if (!entry) return false
  removeSourceEntry(config, entry)
  writeConfig(config)
  return true
}

const destinationFromConfigItem = (item: Record<string, unknown>): Destination => ({
  id: stableId(item),
  type: item.type as Destination["type"],
  path: item.path as string,
  ...item,
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
  config.destinations.push(data as ConfigFile["destinations"][number])
  writeConfig(config)
  return destinationFromConfigItem(data)
}

const updateDestination = (id: string, data: Partial<Destination>): Destination | undefined => {
  const { config } = getConfig()
  const index = config.destinations.findIndex((d) => stableId(d) === id)
  if (index === -1) return undefined
  config.destinations[index] = { ...config.destinations[index], ...data }
  writeConfig(config)
  return destinationFromConfigItem(config.destinations[index])
}

const deleteDestination = (id: string): boolean => {
  const { config } = getConfig()
  const index = config.destinations.findIndex((d) => stableId(d) === id)
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
  DuplicateSourceError,
}
