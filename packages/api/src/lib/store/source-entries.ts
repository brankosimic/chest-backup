import type { ConfigFile, SourceEntry } from "../../types/store"
import { FlatSourceType, SourceOrigin } from "../../types/store"
import { stableId } from "./config"

const sourceKey = (item: Record<string, unknown>): Record<string, unknown> => {
  const type = item.type as string
  if (type === FlatSourceType.Path || type === FlatSourceType.Sqlite) return { type, path: item.path }
  return item
}

const sourceId = (origin: SourceOrigin, item: Record<string, unknown>): string =>
  stableId({ origin, ...sourceKey(item) })

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

export { sourceId, collectSourceEntries, removeSourceEntry, containerForType, insertSourceItem, replaceSourceItem }
