interface ResourceUsage {
  used: number
  total: number
}

interface SystemInfo {
  version: string
  uptime: number
  status: "running" | "idle" | "error"
  cpuUsage: number
  memoryUsage: ResourceUsage
  diskUsage: ResourceUsage
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export type { ResourceUsage, SystemInfo, ApiResponse }
