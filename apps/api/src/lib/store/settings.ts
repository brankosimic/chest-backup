import type { Schedule, RetentionConfig, NotificationConfig } from "@chest-backup/shared"
import { getConfig, writeConfig } from "./config"
import { getDestinations } from "./entities"

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

const getRetention = (): RetentionConfig => {
  const { config } = getConfig()
  const destinations = getDestinations()
  return {
    globalRetention: config.retention ?? 7,
    destinations: destinations.map((d) => ({
      id: d.id,
      retention: (d.retention as number) ?? config.retention ?? 7,
    })),
  }
}

const updateRetention = (data: Partial<RetentionConfig>): RetentionConfig => {
  const { config } = getConfig()
  if (data.globalRetention !== undefined) config.retention = data.globalRetention
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
