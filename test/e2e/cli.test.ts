import { describe, expect, test, beforeAll, afterAll } from "bun:test"
import { mkdirSync, writeFileSync } from "node:fs"
import { E2E } from "./helpers"

beforeAll(E2E.setupE2E)
afterAll(E2E.teardownE2E)

describe("CLI", () => {
  test("dry-run validates config and exits 0", async () => {
    E2E.writeConfig()
    const proc = E2E.spawnBackup(["--dry-run", "--config", E2E.CONFIG_PATH])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)
  })

  test("invalid config exits 1", async () => {
    const badConfigPath = "/tmp/chest-backup-e2e-bad-config.json"
    writeFileSync(badConfigPath, JSON.stringify({ retention: 7 }, null, 2))

    const proc = E2E.spawnBackup(["--run-now", "--config", badConfigPath])
    const exitCode = await proc.exited
    expect(exitCode).toBe(1)
  })

  test("missing config file exits 1", async () => {
    const proc = E2E.spawnBackup(["--run-now", "--config", "/tmp/chest-backup-e2e-nonexistent.json"])
    const exitCode = await proc.exited
    expect(exitCode).toBe(1)
  })

  test("noop mode exits 0 without schedule or --run-now", async () => {
    const config = {
      retention: 2,
      sources: [{ type: "path", path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [{ type: "local" as const, path: E2E.BACKUP_DIR, parallel: false }],
    }
    const noopConfigPath = "/tmp/chest-backup-e2e-noop-config.json"
    writeFileSync(noopConfigPath, JSON.stringify(config, null, 2))

    const proc = E2E.spawnBackup(["--config", noopConfigPath])
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)
  })

  test("config env var resolution", async () => {
    const envSource = "/tmp/chest-backup-e2e-env-source"
    mkdirSync(envSource, { recursive: true })
    writeFileSync(`${envSource}/env-test.txt`, "env var test")

    const config = {
      retention: 2,
      sources: [{ type: "path", path: "${E2E_ENV_TEST_SOURCE}/*" }],
      destinations: [{ type: "local" as const, path: E2E.BACKUP_DIR, parallel: false }],
    }
    const envConfigPath = "/tmp/chest-backup-e2e-env-config.json"
    writeFileSync(envConfigPath, JSON.stringify(config, null, 2))

    const proc = Bun.spawn(["bun", "src/index.ts", "--run-now", "--config", envConfigPath], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, E2E_ENV_TEST_SOURCE: envSource },
    })
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)

    const archives = E2E.archiveFiles(E2E.BACKUP_DIR)
    expect(archives.length).toBeGreaterThanOrEqual(1)
  })

  test("daemon mode handles SIGTERM gracefully", async () => {
    const daemonConfig = {
      schedule: "0 3 * * *",
      retention: 2,
      sources: [{ type: "path", path: `${E2E.TEST_DATA_DIR_1}/*` }],
      destinations: [{ type: "local", path: E2E.BACKUP_DIR, parallel: false }],
    }
    const daemonConfigPath = "/tmp/chest-backup-e2e-daemon-config.json"
    writeFileSync(daemonConfigPath, JSON.stringify(daemonConfig, null, 2))

    const proc = E2E.spawnBackup(["--config", daemonConfigPath])

    await Bun.sleep(500)

    const exited = await Promise.race([
      proc.exited.then((code: number | null) => ({ timedOut: false, code })),
      Bun.sleep(2000).then(() => ({ timedOut: true, code: null })),
    ])

    expect(exited.timedOut).toBe(true)

    proc.kill("SIGTERM")
    const finalCode = await proc.exited
    expect(finalCode).toBe(0)
  })
})
