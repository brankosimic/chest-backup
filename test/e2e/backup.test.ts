import { describe, expect, test, beforeAll, afterAll } from "bun:test"
import { $ } from "bun"
import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { E2E } from "./helpers"

beforeAll(E2E.setupE2E)
afterAll(E2E.teardownE2E)

describe("backup", () => {
  test("multiple sources to local + FTP", async () => {
    E2E.writeConfig()
    const proc = E2E.spawnBackup(["--run-now", "--config", E2E.CONFIG_PATH])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    expect(archives.length).toBeGreaterThanOrEqual(1)
  })

  test("archive contains files from both source directories", async () => {
    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    expect(archives.length).toBeGreaterThanOrEqual(1)

    const latest = archives.sort().reverse()[0]
    expect(latest).toBeDefined()

    if (!latest) return
    const extractDir = "/tmp/chest-backup-e2e-extract"
    mkdirSync(extractDir, { recursive: true })
    await $`tar xzf ${join(E2E.BACKUP_DIR, latest)} -C ${extractDir}`.quiet()

    const extracted = readdirSync(extractDir, { recursive: true }).map((f) => f.toString())
    expect(extracted.some((f) => f.includes("report.pdf"))).toBe(true)
    expect(extracted.some((f) => f.includes("notes.txt"))).toBe(true)
    expect(extracted.some((f) => f.includes("app.config.yaml"))).toBe(true)
    expect(extracted.some((f) => f.includes("docker-compose.override.yml"))).toBe(true)

    await $`rm -rf ${extractDir}`.nothrow().quiet()
  })

  test("checksum file created alongside archive", async () => {
    E2E.writeConfig()
    const proc = E2E.spawnBackup(["--run-now", "--config", E2E.CONFIG_PATH])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    expect(archives.length).toBeGreaterThanOrEqual(1)

    const latest = archives.sort().reverse()[0]
    expect(latest).toBeDefined()
    if (!latest) return

    const shaFile = join(E2E.BACKUP_DIR, `${latest}.sha256`)
    expect(existsSync(shaFile)).toBe(true)
  })

  test("per-destination retention", async () => {
    const localRetDir = "/tmp/chest-backup-e2e-retention-test"
    const config = {
      retention: 5,
      sources: [{ type: "path", path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [
        { type: "local" as const, path: localRetDir, retention: 1, parallel: false },
      ],
    }
    const configPath = "/tmp/chest-backup-e2e-retention-config.json"
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    for (let i = 0; i < 3; i++) {
      const proc = E2E.spawnBackup(["--run-now", "--config", configPath])
      await proc.exited
    }

    const archives = E2E.archiveFiles(localRetDir)
    expect(archives.length).toBeLessThanOrEqual(1)
  })

  test("parallel destinations both receive archive", async () => {
    const parallelDir = "/tmp/chest-backup-e2e-parallel-test"
    const config = {
      retention: 2,
      sources: [{ type: "path", path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [
        { type: "local" as const, path: E2E.BACKUP_DIR, parallel: true },
        { type: "local" as const, path: parallelDir, parallel: true },
      ],
    }
    const configPath = "/tmp/chest-backup-e2e-parallel-config.json"
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const proc = E2E.spawnBackup(["--run-now", "--config", configPath])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const archives1 = E2E.archiveFiles(E2E.BACKUP_DIR)
    expect(archives1.length).toBeGreaterThanOrEqual(1)

    const archives2 = E2E.archiveFiles(parallelDir)
    expect(archives2.length).toBeGreaterThanOrEqual(1)
  })

  test("retention keeps only 2 archives after 3 runs", async () => {
    for (let i = 0; i < 3; i++) {
      const proc = E2E.spawnBackup(["--run-now", "--config", E2E.CONFIG_PATH])
      await proc.exited
    }

    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    expect(archives.length).toBeLessThanOrEqual(2)
  })
})
