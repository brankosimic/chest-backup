import type { Destination, Source } from "./config"

type WebSource = Omit<Source, "createdAt" | "updatedAt">
type WebDestination = Omit<Destination, "createdAt" | "updatedAt">

export type { WebSource, WebDestination }
