import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import type { LocalUsage } from "../types/api"

const collectLocalUsage = (dir: string, acc: LocalUsage): LocalUsage => {
  const entries = readdirSync(dir, { withFileTypes: true })
  entries.forEach((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) collectLocalUsage(full, acc)
    else if (entry.isFile()) {
      try {
        acc.totalSize += statSync(full).size
        acc.fileCount += 1
      } catch (err) {
        console.warn("failed to stat destination file", full, err)
      }
    }
  })

  return acc
}

const scanLocalUsage = (dir: string): LocalUsage => collectLocalUsage(dir, { totalSize: 0, fileCount: 0 })

export { scanLocalUsage }

