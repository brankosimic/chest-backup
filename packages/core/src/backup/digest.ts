import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import type { DigestFn } from "../types/manifest"
import { logger } from "../utils/logger"

const VOLATILE_HEADERS = [
  { magic: "PGDMP", skip: 32 },
  { magic: "SQLite format 3\u0000", skip: 100 },
]

const NONCE_LINE = /^\\(un)?restrict .*$/gm
const PLAIN_SQL_PREFIX = "--\n-- PostgreSQL"
const MASKED_NONCE = "\\$1 NONCE"

const SNIFF_BYTES = 64
const CHUNK_BYTES = 8 * 1024 * 1024

const openChunks = (filePath: string, skip: number): AsyncIterable<Buffer> =>
  createReadStream(filePath, { start: skip, highWaterMark: CHUNK_BYTES }) as AsyncIterable<Buffer>

const readHead = async (filePath: string): Promise<string> => {
  const parts: string[] = []
  for await (const chunk of createReadStream(filePath, { end: SNIFF_BYTES - 1 }) as AsyncIterable<Buffer>) {
    parts.push(chunk.toString("latin1"))
  }

  return parts.join("")
}

const magicSkipBytes = (head: string): number => VOLATILE_HEADERS.find((h) => head.startsWith(h.magic))?.skip ?? 0

const hashBytes = async (filePath: string, skip: number): Promise<string> => {
  const hash = createHash("sha256")
  for await (const chunk of openChunks(filePath, skip)) hash.update(chunk)
  return hash.digest("hex")
}

const maskNonces = (hash: ReturnType<typeof createHash>, filePath: string): Promise<string> => {
  let carry = ""

  const feed = async (): Promise<void> => {
    for await (const chunk of openChunks(filePath, 0)) {
      const text = carry + chunk.toString("utf8")
      const lastBreak = text.lastIndexOf("\n")
      carry = lastBreak === -1 ? text : text.slice(lastBreak + 1)
      if (lastBreak !== -1) hash.update(text.slice(0, lastBreak + 1).replace(NONCE_LINE, MASKED_NONCE))
    }
    hash.update(carry.replace(NONCE_LINE, MASKED_NONCE))
  }

  return feed().then(() => hash.digest("hex"))
}

const digestFile: DigestFn = async (filePath) => {
  try {
    const head = await readHead(filePath)
    if (head.startsWith(PLAIN_SQL_PREFIX)) return await maskNonces(createHash("sha256"), filePath)
    return await hashBytes(filePath, magicSkipBytes(head))
  } catch (err) {
    logger.debug({ filePath, err }, "failed to digest file")
    return null
  }
}

export { digestFile }