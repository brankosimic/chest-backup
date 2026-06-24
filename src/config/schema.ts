import { z } from "zod"

const SourceSchema = z.object({
  path: z.string().min(1),
})

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
})

const DatabaseConfigSchema = z.object({
  type: z.enum(["host", "docker"]),
  database: z.string().optional(),
  connectionString: z.string().optional(),
  containerName: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})

const DiscordConfigSchema = z.object({
  webhookUrl: z.string().url(),
})

const NotificationsConfigSchema = z.object({
  discord: DiscordConfigSchema.optional(),
})

const ConfigSchema = z.object({
  schedule: z.string().optional(),
  retention: z.number().int().positive().default(7),
  sources: z.array(SourceSchema).min(1),
  destinations: z.array(DestinationSchema).min(1),
  databases: z.array(DatabaseConfigSchema).optional(),
  containers: z.array(z.string().min(1)).optional(),
  notifications: NotificationsConfigSchema.optional(),
})

export { ConfigSchema }
