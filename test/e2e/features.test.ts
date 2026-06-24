import { describe, expect, test, beforeAll, afterAll } from "bun:test"
import { $ } from "bun"
import { readdirSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { E2E } from "./helpers"

beforeAll(E2E.setupE2E)
afterAll(E2E.teardownE2E)

describe("features", () => {
  test("database backup survives PG container restart", async () => {
    const stop = Bun.spawn(["docker", "stop", E2E.PG_NAME], { stdout: "pipe", stderr: "pipe" })
    const stopExit = await stop.exited
    expect(stopExit).toBe(0)

    const start = Bun.spawn(["docker", "start", E2E.PG_NAME], { stdout: "pipe", stderr: "pipe" })
    const startExit = await start.exited
    expect(startExit).toBe(0)

    const pgReady = await E2E.waitForPort(E2E.PG_HOST, E2E.PG_PORT)
    expect(pgReady).toBe(true)

    E2E.writeOpenConfig()
    const proc = E2E.spawnBackup(["--run-now", "--config", E2E.OPEN_CONFIG_PATH])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    const latest = archives.sort().reverse()[0]
    expect(latest).toBeDefined()

    if (!latest) return
    const extractDir = "/tmp/chest-backup-e2e-restart-extract"
    mkdirSync(extractDir, { recursive: true })
    await $`tar xzf ${join(E2E.BACKUP_DIR, latest)} -C ${extractDir}`.quiet()
    const extracted = readdirSync(extractDir, { recursive: true }).map((f) => f.toString())
    const hasDbDump = extracted.some((f) => f.includes("db-dump"))
    expect(hasDbDump).toBe(true)
    await $`rm -rf ${extractDir}`.nothrow().quiet()
  })

  test("container lifecycle around backup", async () => {
    const pgCheck = "/tmp/chest-backup-e2e-container-check.sql"
    writeFileSync(pgCheck, "SELECT 1;")

    const containerConfig = {
      retention: 2,
      containers: [E2E.PG_NAME],
      sources: [{ path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [{ type: "local", path: E2E.BACKUP_DIR, parallel: false }],
    }
    const containerConfigPath = "/tmp/chest-backup-e2e-container-config.json"
    writeFileSync(containerConfigPath, JSON.stringify(containerConfig, null, 2))

    const proc = E2E.spawnBackup(["--run-now", "--config", containerConfigPath])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const pgReady = await E2E.waitForPort(E2E.PG_HOST, E2E.PG_PORT)
    expect(pgReady).toBe(true)

    const postCheck = Bun.spawn(["docker", "exec", "-i", E2E.PG_NAME, "psql", "-U", "testuser", "-d", "testdb"], {
      stdin: Bun.file(pgCheck),
      stdout: "pipe",
      stderr: "pipe",
    })
    const checkExit = await postCheck.exited
    expect(checkExit).toBe(0)
  })

  test("database backup via Docker", async () => {
    E2E.writeOpenConfig()
    const proc = E2E.spawnBackup(["--run-now", "--config", E2E.OPEN_CONFIG_PATH])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    const latest = archives.sort().reverse()[0]
    expect(latest).toBeDefined()

    if (!latest) return
    const extractDir = "/tmp/chest-backup-e2e-open-extract"
    mkdirSync(extractDir, { recursive: true })
    await $`tar xzf ${join(E2E.BACKUP_DIR, latest)} -C ${extractDir}`.quiet()
    const extracted = readdirSync(extractDir, { recursive: true }).map((f) => f.toString())
    const hasDbDump = extracted.some((f) => f.includes("db-dump"))
    expect(hasDbDump).toBe(true)
    await $`rm -rf ${extractDir}`.nothrow().quiet()
  })

  test("backup to SFTP server via orchestrator", async () => {
    const config = {
      retention: 2,
      sources: [{ path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [
        {
          type: "sftp" as const,
          host: E2E.SFTP_HOST,
          port: E2E.SFTP_PORT,
          user: E2E.SFTP_USER,
          password: E2E.SFTP_PASS,
          path: "/upload",
          parallel: false,
        },
      ],
    }

    const { runBackup } = await import("../../src/backup/orchestrator")
    const result = await runBackup(config)
    expect(result.success).toBe(true)
  })

  test("Discord notification on successful backup", async () => {
    expect(E2E.DISCORD_WEBHOOK_URL, "E2E_DISCORD_WEBHOOK_URL is required").toBeTruthy()

    const config = {
      retention: 2,
      sources: [{ path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [{ type: "local" as const, path: E2E.BACKUP_DIR, parallel: false }],
      notifications: {
        discord: {
          webhookUrl: E2E.DISCORD_WEBHOOK_URL!,
        },
      },
    }

    const { runBackup } = await import("../../src/backup/orchestrator")
    const result = await runBackup(config)
    expect(result.success).toBe(true)
  })
})

describe("external SFTP", () => {
  const REAL_SOURCE = "/tmp/chest-backup-e2e-real-sftp-source"

  beforeAll(() => {
    mkdirSync(REAL_SOURCE, { recursive: true })
    writeFileSync(`${REAL_SOURCE}/test-file.txt`, "real sftp test content")
  })

  afterAll(() => {
    $`rm -rf ${REAL_SOURCE}`.nothrow().quiet()
  })

  test("backup to external SFTP server", async () => {
    expect(E2E.REAL_SFTP_HOST, "E2E_REAL_SFTP_HOST is required").toBeTruthy()
    expect(E2E.REAL_SFTP_USER, "E2E_REAL_SFTP_USER is required").toBeTruthy()

    const config = {
      retention: 2,
      sources: [{ path: `${REAL_SOURCE}/*` }],
      destinations: [
        {
          type: "sftp" as const,
          host: E2E.REAL_SFTP_HOST!,
          port: E2E.REAL_SFTP_PORT,
          user: E2E.REAL_SFTP_USER!,
          password: E2E.REAL_SFTP_PASSWORD,
          privateKey: E2E.REAL_SFTP_PRIVATE_KEY,
          path: E2E.REAL_SFTP_PATH!,
          timeout: 10000,
          parallel: false,
        },
      ],
    }

    const { runBackup } = await import("../../src/backup/orchestrator")
    const result = await runBackup(config)
    expect(result.success).toBe(true)
  }, { timeout: 30_000 })
})
