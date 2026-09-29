type PathSource = {
  type: "path"
  path: string
  isFile?: boolean
}

type ParsedConnString = {
  host: string
  port: number
  user: string
  password: string
}

type PostgresSource = {
  type: "postgres"
  host: string
  port: number
  user: string
  password: string
  database: string
}

type PostgresContainerSource = {
  type: "postgres-container"
  containerName: string
  user: string
  password: string
  database: string
}

type ContainerVolumeSource = {
  type: "container-volume"
  containerName: string
  volumePath: string
  include?: string[]
}

type SqliteSource = {
  type: "sqlite"
  path: string
}

type SqliteContainerSource = {
  type: "sqlite-container"
  containerName: string
  dbPath: string
}

type Source =
  PathSource | PostgresSource | PostgresContainerSource | ContainerVolumeSource | SqliteSource | SqliteContainerSource

interface Destination {
  id?: string
  type: "local" | "sftp"
  name?: string
  path: string
  host?: string
  port?: number
  user?: string
  password?: string
  privateKey?: string
  retention?: number
  parallel?: boolean
  timeout?: number
  skip?: boolean
}

interface DiscordConfig {
  webhookUrl: string
}

interface NotificationsConfig {
  discord?: DiscordConfig
}

interface ConfigFile {
  schedule?: string
  retention: number
  tempDir?: string
  paths?: string[]
  sqlite?: string[]
  sources: Source[]
  destinations: Destination[]
  notifications?: NotificationsConfig
}

type Config = Omit<ConfigFile, "paths" | "sqlite"> & {
  paths: string[]
  sqlite: string[]
}

export type {
  Config,
  ConfigFile,
  Source,
  PathSource,
  PostgresSource,
  PostgresContainerSource,
  ContainerVolumeSource,
  SqliteSource,
  SqliteContainerSource,
  Destination,
  ParsedConnString,
  DiscordConfig,
  NotificationsConfig,
}
