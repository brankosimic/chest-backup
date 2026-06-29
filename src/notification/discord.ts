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

const formatSpeed = (bytesPerSec: number): string => {
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)}B/s`
  const kb = bytesPerSec / 1024
  if (kb < 1024) return `${kb.toFixed(1)}KB/s`
  return `${(kb / 1024).toFixed(1)}MB/s`
}

const calcEmbedStatus = (result: BackupResult): { color: number; title: string; successCount: number; skippedCount: number; failCount: number } => {
  const successCount = result.destinationResults.filter((r) => r.success && !r.skipped).length
  const skippedCount = result.destinationResults.filter((r) => r.skipped).length
  const failCount = result.destinationResults.length - successCount - skippedCount

  let color: number
  let title: string

  if (result.success && skippedCount === result.destinationResults.length) {
    color = 0x3498db
    title = "Backup Skipped — No Changes"
  } else if (result.success) {
    color = 0x00ff00
    title = "Backup Successful"
  } else if (successCount > 0 || skippedCount > 0) {
    color = 0xffa500
    title = "Backup Partial Success"
  } else {
    color = 0xff0000
    title = "Backup Failed"
  }

  return { color, title, successCount, skippedCount, failCount }
}

const buildEmbedFields = (result: BackupResult, successCount: number, skippedCount: number, failCount: number): DiscordEmbed["fields"] => {
  const fields: DiscordEmbed["fields"] = []

  if (result.archiveName) fields.push({ name: "Archive", value: result.archiveName, inline: true })
  if (result.archiveSize) fields.push({ name: "Size", value: formatSize(result.archiveSize), inline: true })

  if (result.verification) {
    const passed = result.verification.integrity ? "Pass" : "Fail"
    fields.push({ name: "Verification", value: `Integrity: ${passed}`, inline: false })
  }

  fields.push({ name: "Duration", value: formatDuration(result.durationMs), inline: true })

  const destParts: string[] = []
  if (successCount) destParts.push(`${String(successCount)} succeeded`)
  if (skippedCount) destParts.push(`${String(skippedCount)} skipped (identical)`)
  if (failCount) destParts.push(`${String(failCount)} failed`)
  fields.push({ name: "Destinations", value: destParts.join(", ") || "none", inline: false })

  result.destinationResults.forEach((d) => {
    if (d.skipped) {
      fields.push({ name: d.destLabel ?? "Destination", value: `Skipped — ${d.skippedReason ?? "identical"}`, inline: true })
      return
    }
    const speedStr = d.speed !== undefined ? ` | ${formatSpeed(d.speed)}` : ""
    fields.push({ name: d.destLabel ?? "Destination", value: `${d.error ? "Failed" : "OK"}${d.durationMs !== undefined ? ` (${formatDuration(d.durationMs)})` : ""}${speedStr}`, inline: true })
  })

  if (result.errors.length)
    fields.push({ name: "Errors", value: result.errors.map((e) => `\`${e}\``).join("\n"), inline: false })

  fields.push({ name: "Timestamp", value: result.timestamp, inline: false })

  return fields
}

const buildEmbed = (result: BackupResult): DiscordEmbed => {
  const { color, title, successCount, skippedCount, failCount } = calcEmbedStatus(result)
  const fields = buildEmbedFields(result, successCount, skippedCount, failCount)

  return { title, description: "", color, fields, timestamp: new Date().toISOString() }
}

const buildStartedEmbed = (timestamp: string): DiscordEmbed => ({
  title: "Backup Started",
  description: "A backup operation is in progress…",
  color: 0x3498db,
  fields: [{ name: "Timestamp", value: timestamp, inline: false }],
  timestamp: new Date().toISOString(),
})

const sendDiscordStartedNotification = async (webhookUrl: string, timestamp: string): Promise<void> => {
  const embed = buildStartedEmbed(timestamp)
  const payload: DiscordPayload = { embeds: [embed] }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) logger.error({ status: response.status }, "discord started notification failed")
  else logger.info("discord started notification sent")
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

const sendStartedNotification = async (config: Config, timestamp: string): Promise<void> => {
  if (!config.notifications?.discord) return

  try {
    await sendDiscordStartedNotification(config.notifications.discord.webhookUrl, timestamp)
  } catch (err) {
    logger.error({ err }, "failed to send started notification")
  }
}

const sendCompletedNotification = async (config: Config, result: BackupResult): Promise<void> => {
  if (!config.notifications?.discord) return

  try {
    await sendDiscordNotification(config.notifications.discord.webhookUrl, result)
  } catch (err) {
    logger.error({ err }, "failed to send notification")
  }
}

export { sendDiscordNotification, sendStartedNotification, sendCompletedNotification }
