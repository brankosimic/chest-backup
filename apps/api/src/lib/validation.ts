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

const DockerComposeSourceSchema = z.object({
  type: z.literal("docker-compose"),
  name: z.string().min(1, "Name is required"),
  path: z.string().min(1, "Path is required"),
  containers: z.array(z.string().min(1, "Container name is required")),
  include: z.array(z.string().min(1)).optional(),
})

const SourceSchema = z.discriminatedUnion("type", [
  PathSourceSchema,
  PostgresSourceSchema,
  PostgresContainerSourceSchema,
  DockerComposeSourceSchema,
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
  destinations: z.array(z.object({ id: z.string(), retention: z.number().int().positive() })),
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

export {
  DestinationSchema,
  DockerComposeSourceSchema,
  NotificationsSchema,
  PathSourceSchema,
  PostgresContainerSourceSchema,
  PostgresSourceSchema,
  RetentionSchema,
  ScheduleSchema,
  SourceSchema,
}
