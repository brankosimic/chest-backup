import { z } from "zod"

const PathSourceSchema = z.object({
  type: z.literal("path"),
  path: z.string().min(1, "Path is required"),
})

const PostgresSourceSchema = z.object({
  type: z.literal("postgres"),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().positive("Port must be positive"),
  user: z.string().min(1, "User is required"),
  password: z.string().min(1, "Password is required"),
  database: z.string().min(1, "Database is required"),
})

const PostgresContainerSourceSchema = z.object({
  type: z.literal("postgres-container"),
  containerName: z.string().min(1, "Container name is required"),
  user: z.string().min(1, "User is required"),
  password: z.string().min(1, "Password is required"),
  database: z.string().min(1, "Database is required"),
})

const ContainerVolumeSourceSchema = z.object({
  type: z.literal("container-volume"),
  containerName: z.string().min(1, "Container name is required"),
  volumePath: z.string().min(1, "Volume path is required"),
  include: z.array(z.string().min(1)).optional(),
})

const SqliteSourceSchema = z.object({
  type: z.literal("sqlite"),
  path: z.string().min(1, "Path is required"),
})

const SqliteContainerSourceSchema = z.object({
  type: z.literal("sqlite-container"),
  containerName: z.string().min(1, "Container name is required"),
  dbPath: z.string().min(1, "Database path is required"),
})

const SourceSchema = z.discriminatedUnion("type", [
  PathSourceSchema,
  PostgresSourceSchema,
  PostgresContainerSourceSchema,
  ContainerVolumeSourceSchema,
  SqliteSourceSchema,
  SqliteContainerSourceSchema,
])

const DestinationSchema = z.object({
  type: z.enum(["local", "sftp"]),
  path: z.string().min(1, "Path is required"),
  host: z.string().optional(),
  port: z.number().int().positive("Port must be positive").optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  retention: z.number().int().positive("Retention must be positive").optional(),
  parallel: z.boolean().optional(),
  timeout: z.number().int().positive("Timeout must be positive").optional(),
  skip: z.boolean().optional(),
})

const ScheduleSchema = z.object({
  schedule: z.string().min(1, "Schedule is required"),
  enabled: z.boolean().optional().default(true),
})

const RetentionSchema = z.object({
  globalRetention: z.number().int().positive("Global retention must be positive"),
})

const NotificationsSchema = z.object({
  discord: z
    .object({
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      webhookUrl: z.string().url(),
      enabled: z.boolean().optional().default(true),
    })
    .optional(),
})

const PostgresDatabasesSchema = z.object({
  type: z.enum(["postgres", "postgres-container"]),
  host: z.string().optional(),
  port: z.number().optional(),
  user: z.string(),
  password: z.string(),
  containerName: z.string().optional(),
  database: z.string().optional(),
})

export {
  ContainerVolumeSourceSchema,
  DestinationSchema,
  NotificationsSchema,
  PathSourceSchema,
  PostgresContainerSourceSchema,
  PostgresDatabasesSchema,
  PostgresSourceSchema,
  RetentionSchema,
  ScheduleSchema,
  SqliteSourceSchema,
  SqliteContainerSourceSchema,
  SourceSchema,
}
