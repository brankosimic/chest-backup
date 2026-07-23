import type { Retention } from "../../types/api"
import type { Schedule, NotificationConfig } from "@chest-backup/shared"
import { getConfig, writeConfig } from "./config"

const getSchedule = (): Schedule => {
  const { config } = getConfig()
  return { schedule: config.schedule ?? "", enabled: true }
}

const updateSchedule = (data: Partial<Schedule>): Schedule => {
  const { config } = getConfig()
  if (data.schedule !== undefined) config.schedule = data.schedule
  writeConfig(config)
  return getSchedule()
}

const getRetention = (): Retention => {
  const { config } = getConfig()
  return { globalRetention: config.retention ?? 7 }
}

const updateRetention = (data: Retention): Retention => {
  const { config } = getConfig()
  config.retention = data.globalRetention
  writeConfig(config)
  return getRetention()
}

const getNotifications = (): NotificationConfig => {
  const { config } = getConfig()
  const discordConfig = config.notifications?.discord
  return {
    discord: discordConfig
      ? { webhookUrl: discordConfig.webhookUrl ?? "", enabled: true }
      : undefined,
  }
}

const updateNotifications = (data: Partial<NotificationConfig>): NotificationConfig => {
  const { config } = getConfig()
  if (data.discord) {
    if (!config.notifications) config.notifications = {}
    config.notifications.discord = { webhookUrl: data.discord.webhookUrl }
  }
  writeConfig(config)
  return getNotifications()
}

export {
  getSchedule,
  updateSchedule,
  getRetention,
  updateRetention,
  getNotifications,
  updateNotifications,
}
