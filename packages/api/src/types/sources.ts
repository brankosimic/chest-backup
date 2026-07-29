interface PostgresQuery {
  type: "postgres" | "postgres-container"
  host?: string
  port?: number
  user: string
  password: string
  containerName?: string
  database?: string
}

interface PostgresQueryResult {
  success: boolean
  databases?: string[]
  message?: string
}

interface ContainerVolume {
  type: string
  source: string
  destination: string
  name?: string
  rw: boolean
}

interface DockerMount {
  Type: string
  Source: string
  Destination: string
  Name?: string
  RW: boolean
}

export type { PostgresQuery, PostgresQueryResult, ContainerVolume, DockerMount }
