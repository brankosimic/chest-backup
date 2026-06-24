import type { BackupResult } from "../types/index"
import type { Config } from "../types/config"
import { logger } from "../utils/logger"

interface DiscordEmbed {
  title: string
  description: string
  color: number
  fields: { name: string; value: string; inline?: boolean }[]
  timestamp: string
}

interface DiscordPayload {
  embeds: DiscordEmbed[]
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${String(ms)}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${String(s)}s`
  const m = Math.floor(s / 60)
  const remainingS = s % 60
  return `${String(m)}m ${String(remainingS)}s`
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)}KB`
  return `${(kb / 1024).toFixed(1)}MB`
}

const buildEmbed = (result: BackupResult): DiscordEmbed => {
  const successCount = result.destinationResults.filter((r) => r.success).length
  const failCount = result.destinationResults.length - successCount

  let color: number
  let title: string

  if (result.success) {
    color = 0x00ff00
    title = "Backup Successful"
  } else if (successCount > 0) {
    color = 0xffa500
    title = "Backup Partial Success"
  } else {
    color = 0xff0000
    title = "Backup Failed"
  }

  const fields: DiscordEmbed["fields"] = []

  if (result.archiveName) fields.push({ name: "Archive", value: result.archiveName, inline: true })
  if (result.archiveSize) fields.push({ name: "Size", value: formatSize(result.archiveSize), inline: true })

  if (result.verification) {
    const passed = result.verification.integrity ? "Pass" : "Fail"
    fields.push({ name: "Verification", value: `Integrity: ${passed}`, inline: false })
  }

  fields.push({ name: "Duration", value: formatDuration(result.durationMs), inline: true })
  fields.push({ name: "Destinations", value: `${String(successCount)} succeeded, ${String(failCount)} failed`, inline: false })

  result.destinationResults.forEach((d) => fields.push({ name: d.destLabel ?? "Destination", value: `${d.error ? "Failed" : "OK"}${d.durationMs !== undefined ? ` (${formatDuration(d.durationMs)})` : ""}`, inline: true }))

  if (result.errors.length)
    fields.push({ name: "Errors", value: result.errors.map((e) => `\`${e}\``).join("\n"), inline: false })

  fields.push({ name: "Timestamp", value: result.timestamp, inline: false })

  return { title, description: "", color, fields, timestamp: new Date().toISOString() }
}

const sendDiscordNotification = async (webhookUrl: string, result: BackupResult): Promise<void> => {
  const embed = buildEmbed(result)
  const payload: DiscordPayload = { embeds: [embed] }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) logger.error({ status: response.status }, "discord notification failed")
  else logger.info("discord notification sent")
}

const sendNotification = async (config: Config, result: BackupResult): Promise<void> => {
  if (!config.notifications?.discord) return

  try {
    await sendDiscordNotification(config.notifications.discord.webhookUrl, result)
  } catch (err) {
    logger.error({ err }, "failed to send notification")
  }
}

export { sendDiscordNotification, sendNotification }
