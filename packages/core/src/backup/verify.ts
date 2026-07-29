import { $ } from "bun"
import { createHash } from "node:crypto"
import { createReadStream, writeFileSync } from "node:fs"
import type { VerifyResult } from "../types/index"
import { logger } from "../utils/logger"

const verifyArchiveIntegrity = async (archivePath: string): Promise<boolean> => {
  try {
    await $`tar tzf ${archivePath}`.quiet()
    return true
  } catch {
    return false
  }
}

const generateChecksum = async (archivePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256")
    const stream = createReadStream(archivePath)
    stream.on("data", (data) => hash.update(data))
    stream.on("end", () => {
      resolve(hash.digest("hex"))
    })
    stream.on("error", reject)
  })
}

const verifyArchive = async (archivePath: string): Promise<VerifyResult> => {
  const [integrity, checksum] = await Promise.all([verifyArchiveIntegrity(archivePath), generateChecksum(archivePath)])

  const checksumFile = `${archivePath}.sha256`
  const archiveName = archivePath.split("/").pop() ?? "unknown"
  writeFileSync(checksumFile, `${checksum}  ${archiveName}\n`)

  logger.info({ integrity, checksum }, "archive verification completed")
  return { integrity, checksum, checksumFile }
}

export { verifyArchive }
