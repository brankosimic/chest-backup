import { z } from "zod"

const PathSourceSchema = z.object({
  type: z.literal("path"),
  path: z.string().min(1),
})

const PostgresSourceSchema = z.object({
  type: z.literal("postgres"),
  host: z.string().min(1),
  port: z.number().int().positive(),
  user: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
})

const PostgresContainerSourceSchema = z.object({
  type: z.literal("postgres-container"),
  containerName: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
})

const DockerComposeSourceSchema = z.object({
  type: z.literal("docker-compose"),
  name: z.string().min(1),
  path: z.string().min(1),
  containers: z.array(z.string().min(1)),
})

const SourceSchema = z.discriminatedUnion("type", [
  PathSourceSchema,
  PostgresSourceSchema,
  PostgresContainerSourceSchema,
  DockerComposeSourceSchema,
])

const DestinationSchema = z.object({
  type: z.enum(["local", "sftp"]),
  path: z.string().min(1),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  retention: z.number().int().positive().optional(),
  parallel: z.boolean().optional().default(true),
  timeout: z.number().int().positive().optional(),
  skip: z.boolean().optional().default(false),
})

const DiscordConfigSchema = z.object({
  webhookUrl: z.url(),
})

const NotificationsConfigSchema = z.object({
  discord: DiscordConfigSchema.optional(),
})

const ConfigSchema = z.object({
  schedule: z.string().optional(),
  retention: z.number().int().positive().default(7),
  tempDir: z.string().optional().default("/tmp"),
  sources: z.array(SourceSchema).min(1),
  destinations: z.array(DestinationSchema).min(1),
  notifications: NotificationsConfigSchema.optional(),
})

export { ConfigSchema }
