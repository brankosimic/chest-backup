import type { Destination } from "@chest-backup/shared"
import type { ConfigFile } from "../../types/store"
import { getConfig, writeConfig, stableId, now } from "./config"

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

export { getDestinations, findDestinationById, createDestination, updateDestination, deleteDestination }
