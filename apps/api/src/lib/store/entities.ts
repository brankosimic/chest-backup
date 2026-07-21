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

const sourceFromConfigItem = (item: Record<string, unknown>): Source => {
  const source = {
    id: stableId(item),
    type: item.type as Source["type"],
    ...item,
    createdAt: now(),
    updatedAt: now(),
  } as Source

  if (source.type === "path" && !("isFile" in source) && "path" in source) {
    (source as { isFile?: boolean }).isFile = detectPathType((source.path as string) ?? "")
  }

  return source
}

const getSources = (): Source[] => {
  const { config } = getConfig()
  return config.sources.map(sourceFromConfigItem)
}

const findSourceById = (id: string): Source | undefined =>
  getSources().find((s) => s.id === id)

const createSource = (data: Record<string, unknown>): Source => {
  const { config } = getConfig()
  const newSource = { ...data }
  config.sources.push(newSource)
  writeConfig(config)
  return sourceFromConfigItem(newSource)
}

const updateSource = (id: string, data: Partial<Source>): Source | undefined => {
  const { config } = getConfig()
  const index = config.sources.findIndex((s) => stableId(s) === id)
  if (index === -1) return undefined
  config.sources[index] = { ...config.sources[index], ...data }
  writeConfig(config)
  return sourceFromConfigItem(config.sources[index])
}

const deleteSource = (id: string): boolean => {
  const { config } = getConfig()
  const index = config.sources.findIndex((s) => stableId(s) === id)
  if (index === -1) return false
  config.sources.splice(index, 1)
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
}) as Destination

const getDestinations = (): Destination[] => {
  const { config } = getConfig()
  return config.destinations.map(destinationFromConfigItem)
}

const findDestinationById = (id: string): Destination | undefined =>
  getDestinations().find((d) => d.id === id)

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
}
