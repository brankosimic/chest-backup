import type { BackupResult } from "../types/index"
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

function buildEmbed(result: BackupResult): DiscordEmbed {
  const successCount = result.destinationResults.filter((r) => r.success).length
  const failCount = result.destinationResults.length - successCount

  let color: number
  let title: string

  if (result.success) {
    color = 0x00ff00
    title = "✅ Backup Successful"
  } else if (successCount > 0) {
    color = 0xffa500
    title = "⚠️ Backup Partial Success"
  } else {
    color = 0xff0000
    title = "❌ Backup Failed"
  }

  const fields: DiscordEmbed["fields"] = []

  if (result.archiveName) {
    fields.push({ name: "Archive", value: result.archiveName, inline: true })
  }
  if (result.archiveSize) {
    const sizeMb = (result.archiveSize / 1024 / 1024).toFixed(2)
    fields.push({ name: "Size", value: `${sizeMb} MB`, inline: true })
  }

  if (result.verification) {
    const icon = result.verification.integrity ? "✅" : "❌"
    const shortChecksum = result.verification.checksum.slice(0, 16)
    fields.push({ name: "Verification", value: `${icon} Integrity: ${result.verification.integrity ? "Pass" : "Fail"}\`\`\`sha256:${shortChecksum}...\`\`\``, inline: false })
  }

  fields.push({ name: "Duration", value: `${result.durationMs}ms`, inline: true })
  fields.push({ name: "Destinations", value: `${successCount} succeeded, ${failCount} failed`, inline: false })

  if (result.errors.length) {
    fields.push({ name: "Errors", value: result.errors.map((e) => `\`${e}\``).join("\n"), inline: false })
  }

  fields.push({ name: "Timestamp", value: result.timestamp, inline: false })

  return { title, description: "", color, fields, timestamp: new Date().toISOString() }
}

async function sendDiscordNotification(webhookUrl: string, result: BackupResult): Promise<void> {
  const embed = buildEmbed(result)
  const payload: DiscordPayload = { embeds: [embed] }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    logger.error({ status: response.status }, "discord notification failed")
  } else {
    logger.info("discord notification sent")
  }
}

export { sendDiscordNotification }
