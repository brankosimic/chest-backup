import type { BackupRecord, Destination, LogEntry, NotificationConfig, RetentionConfig, Schedule, Source, SystemInfo } from "@chest-backup/shared"

const generateId = (): string => {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const now = (): string => new Date().toISOString()

const makeSource = (type: Source["type"], data: Record<string, unknown>): Source => ({
  id: generateId(),
  type,
  createdAt: now(),
  updatedAt: now(),
  ...data,
})

const makeDestination = (type: Destination["type"], data: Record<string, unknown>): Destination => ({
  id: generateId(),
  type,
  createdAt: now(),
  updatedAt: now(),
  ...data,
})

const sources: Source[] = [
  makeSource("path", { path: "/data/documents" }),
  makeSource("path", { path: "/data/config.yaml" }),
  makeSource("postgres", { host: "localhost", port: 5432, user: "backup_user", password: "********", database: "myapp" }),
  makeSource("docker-compose", { name: "web-stack", path: "/opt/docker/web", containers: ["web-app", "web-worker"] }),
]

const destinations: Destination[] = [
  makeDestination("local", { path: "/backups/local", retention: 30, parallel: true }),
  makeDestination("sftp", { host: "backups.example.com", port: 22, user: "backupuser", privateKey: "~/.ssh/backup_key", path: "/backups", retention: 14 }),
]

const schedule: Schedule = {
  schedule: "0 3 * * *",
  enabled: true,
  lastRun: new Date(Date.now() - 86400000).toISOString(),
  nextRun: new Date(Date.now() + 86400000).toISOString(),
}

const retention: RetentionConfig = {
  globalRetention: 7,
  destinations: destinations.map((d) => ({ id: d.id, retention: d.retention ?? 7 })),
}

const notifications: NotificationConfig = {
  discord: {
    webhookUrl: "https://discord.com/api/webhooks/example/example-token",
    enabled: true,
  },
}

const backups: BackupRecord[] = [
  {
    id: generateId(),
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    success: true,
    archiveName: "chest-backup-20260629-030000.tar.gz",
    archiveSize: 524288000,
    durationMs: 45000,
    destinationResults: [
      { success: true, durationMs: 12000, destLabel: "local", speed: 43690666 },
      { success: true, durationMs: 33000, destLabel: "sftp", speed: 15887515 },
    ],
    errors: [],
  },
  {
    id: generateId(),
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    success: true,
    archiveName: "chest-backup-20260628-030000.tar.gz",
    archiveSize: 518003200,
    durationMs: 42000,
    destinationResults: [
      { success: true, durationMs: 11000, destLabel: "local", speed: 47091200 },
      { success: true, durationMs: 31000, destLabel: "sftp", speed: 16709780 },
    ],
    errors: [],
  },
  {
    id: generateId(),
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    success: false,
    durationMs: 15000,
    destinationResults: [{ success: false, error: "SFTP connection timeout", destLabel: "sftp" }],
    errors: ["SFTP connection timeout"],
  },
  {
    id: generateId(),
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    success: true,
    archiveName: "chest-backup-20260626-030000.tar.gz",
    archiveSize: 510000000,
    durationMs: 38000,
    destinationResults: [
      { success: true, durationMs: 10000, destLabel: "local", speed: 51000000 },
      { success: true, durationMs: 28000, destLabel: "sftp", speed: 18214285 },
    ],
    errors: [],
  },
  {
    id: generateId(),
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    success: true,
    archiveName: "chest-backup-20260625-030000.tar.gz",
    archiveSize: 498000000,
    durationMs: 40000,
    destinationResults: [
      { success: true, durationMs: 11000, destLabel: "local", speed: 45272727 },
      { success: true, durationMs: 29000, destLabel: "sftp", speed: 17172413 },
    ],
    errors: [],
  },
]

const logs: LogEntry[] = [
  { id: generateId(), timestamp: new Date(Date.now() - 3600000).toISOString(), level: "info", message: "Backup started", metadata: { timestamp: "20260629-030000" } },
  { id: generateId(), timestamp: new Date(Date.now() - 3500000).toISOString(), level: "info", message: "Archive created", metadata: { archiveName: "chest-backup-20260629-030000.tar.gz", size: 524288000 } },
  { id: generateId(), timestamp: new Date(Date.now() - 3400000).toISOString(), level: "info", message: "Backup completed successfully", metadata: { durationMs: 45000 } },
  { id: generateId(), timestamp: new Date(Date.now() - 7200000).toISOString(), level: "warn", message: "SFTP connection slow", metadata: { host: "backups.example.com" } },
  { id: generateId(), timestamp: new Date(Date.now() - 86400000).toISOString(), level: "info", message: "Backup started", metadata: { timestamp: "20260628-030000" } },
  { id: generateId(), timestamp: new Date(Date.now() - 86300000).toISOString(), level: "info", message: "Backup completed successfully", metadata: { durationMs: 42000 } },
  { id: generateId(), timestamp: new Date(Date.now() - 172800000).toISOString(), level: "error", message: "SFTP connection timeout", metadata: { host: "backups.example.com" } },
  { id: generateId(), timestamp: new Date(Date.now() - 172700000).toISOString(), level: "info", message: "Local backup succeeded", metadata: { path: "/backups/local" } },
  { id: generateId(), timestamp: new Date(Date.now() - 259200000).toISOString(), level: "info", message: "Backup started", metadata: { timestamp: "20260626-030000" } },
  { id: generateId(), timestamp: new Date(Date.now() - 259100000).toISOString(), level: "info", message: "Backup completed successfully", metadata: { durationMs: 38000 } },
]

const systemInfo: SystemInfo = {
  version: "1.0.0",
  uptime: 86400,
  status: "running",
  cpuUsage: 12.5,
  memoryUsage: 45.2,
  diskUsage: 62.8,
}

const findSourceById = (id: string): Source | undefined => sources.find((s) => s.id === id)
const findDestinationById = (id: string): Destination | undefined => destinations.find((d) => d.id === id)

const getSources = (): Source[] => [...sources]
const createSource = (data: Source): Source => {
  const newSource = { ...data, id: generateId(), createdAt: now(), updatedAt: now() }
  sources.push(newSource)
  return newSource
}
const updateSource = (id: string, data: Partial<Source>): Source | undefined => {
  const index = sources.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  const updated = { ...sources[index], ...data, id, updatedAt: now() }
  sources[index] = updated
  return updated
}
const deleteSource = (id: string): boolean => {
  const index = sources.findIndex((s) => s.id === id)
  if (index === -1) return false
  sources.splice(index, 1)
  return true
}

const getDestinations = (): Destination[] => [...destinations]
const createDestination = (data: Destination): Destination => {
  const newDest = { ...data, id: generateId(), createdAt: now(), updatedAt: now() }
  destinations.push(newDest)
  return newDest
}
const updateDestination = (id: string, data: Partial<Destination>): Destination | undefined => {
  const index = destinations.findIndex((d) => d.id === id)
  if (index === -1) return undefined
  const updated = { ...destinations[index], ...data, id, updatedAt: now() }
  destinations[index] = updated
  return updated
}
const deleteDestination = (id: string): boolean => {
  const index = destinations.findIndex((d) => d.id === id)
  if (index === -1) return false
  destinations.splice(index, 1)
  return true
}

const getSchedule = (): Schedule => ({ ...schedule })
const updateSchedule = (data: Partial<Schedule>): Schedule => {
  Object.assign(schedule, data)
  return { ...schedule }
}

const getRetention = (): RetentionConfig => ({ ...retention, destinations: [...retention.destinations] })
const updateRetention = (data: Partial<RetentionConfig>): RetentionConfig => {
  Object.assign(retention, data)
  return { ...retention, destinations: [...retention.destinations] }
}

const getNotifications = (): NotificationConfig => ({ ...notifications })
const updateNotifications = (data: Partial<NotificationConfig>): NotificationConfig => {
  Object.assign(notifications, data)
  return { ...notifications }
}

const getBackups = (page = 1, limit = 20): { data: BackupRecord[]; total: number; page: number; limit: number } => {
  const start = (page - 1) * limit
  const paged = backups.slice(start, start + limit)
  return { data: paged, total: backups.length, page, limit }
}

const getBackupById = (id: string): BackupRecord | undefined => backups.find((b) => b.id === id)

const getBackupStats = () => {
  const total = backups.length
  const success = backups.filter((b) => b.success).length
  const failed = total - success
  const avgDuration = total > 0 ? backups.reduce((acc, b) => acc + b.durationMs, 0) / total : 0
  const totalSize = backups.reduce((acc, b) => acc + (b.archiveSize ?? 0), 0)
  return { total, success, failed, avgDuration, totalSize }
}

const getLogs = (level?: string, search?: string, page = 1, limit = 50): { data: LogEntry[]; total: number; page: number; limit: number } => {
  let filtered = [...logs]
  if (level) filtered = filtered.filter((l) => l.level === level)
  if (search) filtered = filtered.filter((l) => l.message.toLowerCase().includes(search.toLowerCase()))
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const start = (page - 1) * limit
  const paged = filtered.slice(start, start + limit)
  return { data: paged, total: filtered.length, page, limit }
}

const getSystem = (): SystemInfo => ({ ...systemInfo })

export {
  createDestination,
  createSource,
  deleteDestination,
  deleteSource,
  findDestinationById,
  findSourceById,
  getBackups,
  getBackupById,
  getBackupStats,
  getDestinations,
  getLogs,
  getNotifications,
  getRetention,
  getSchedule,
  getSources,
  getSystem,
  updateDestination,
  updateNotifications,
  updateSource,
  updateRetention,
  updateSchedule,
}
