interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

interface DiscordEmbed {
  title: string
  description: string
  color: number
  fields: DiscordEmbedField[]
  timestamp: string
}

interface DiscordPayload {
  embeds: DiscordEmbed[]
}

interface EmbedStatus {
  color: number
  title: string
  successCount: number
  skippedCount: number
  failCount: number
}

export type { DiscordEmbedField, DiscordEmbed, DiscordPayload, EmbedStatus }
