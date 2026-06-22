import { describe, expect, test, beforeAll, afterAll } from "bun:test"
import { $ } from "bun"
import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const TEST_DATA_DIR_1 = "/tmp/chest-backup-e2e-data/docs"
const TEST_DATA_DIR_2 = "/tmp/chest-backup-e2e-data/configs"
const BACKUP_DIR = "/tmp/chest-backup-e2e-backups"
const CONFIG_PATH = "/tmp/chest-backup-e2e-config.json"
const OPEN_CONFIG_PATH = "/tmp/chest-backup-e2e-open-config.json"
const FTP_PORT = 2121
const FTP_USER = "testftp"
const FTP_PASS = "testftppass"

const NGINX_NAME = "chest-backup-e2e-nginx"
const PG_NAME = "chest-backup-e2e-pg"

function archiveFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.startsWith("chest-backup-") && f.endsWith(".tar.gz"))
}

function writeConfig(includeFtp: boolean): void {
  const destinations: Array<Record<string, unknown>> = [
    { type: "local", path: BACKUP_DIR, parallel: false },
  ]

  if (includeFtp) {
    destinations.push({
      type: "ftp",
      host: "127.0.0.1",
      port: FTP_PORT,
      user: FTP_USER,
      password: FTP_PASS,
      path: "/",
      parallel: true,
    })
  }

  const config = {
    retention: 2,
    sources: [
      { path: `${TEST_DATA_DIR_1}/*` },
      { path: `${TEST_DATA_DIR_2}/*` },
    ],
    destinations,
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

function writeOpenConfig(): void {
  const config = {
    retention: 2,
    sources: [
      { path: `${TEST_DATA_DIR_1}/*` },
      { path: `${TEST_DATA_DIR_2}/*` },
    ],
    destinations: [
      { type: "local", path: BACKUP_DIR, parallel: false },
    ],
    containers: [NGINX_NAME],
    databases: [
      {
        type: "docker",
        containerName: PG_NAME,
        database: "testdb",
        username: "testuser",
        password: "testpass",
      },
    ],
  }

  writeFileSync(OPEN_CONFIG_PATH, JSON.stringify(config, null, 2))
}

async function ensureContainer(name: string, image: string, args: string[]): Promise<boolean> {
  const existing = await $`docker ps -a --filter name=${name} -q`.text()
  if (existing.trim()) {
    await $`docker rm -f ${name}`.nothrow().quiet()
  }

  const pull = await $`docker pull ${image}`.nothrow()
  if (pull.exitCode !== 0) return false

  const proc = Bun.spawn(["docker", "run", "-d", "--name", name, ...args, image], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  return exitCode === 0
}

beforeAll(async () => {
  mkdirSync(TEST_DATA_DIR_1, { recursive: true })
  mkdirSync(TEST_DATA_DIR_2, { recursive: true })
  mkdirSync(BACKUP_DIR, { recursive: true })

  writeFileSync(join(TEST_DATA_DIR_1, "report.pdf"), "fake pdf content")
  writeFileSync(join(TEST_DATA_DIR_1, "notes.txt"), "some notes")
  writeFileSync(join(TEST_DATA_DIR_2, "app.config.yaml"), "key: value\n")
  writeFileSync(join(TEST_DATA_DIR_2, "docker-compose.override.yml"), "services:\n  web:\n    ports:\n      - \"8080:80\"\n")

  await ensureContainer("chest-backup-e2e-ftp", "fauria/vsftpd", [
    "-p", `${FTP_PORT}:21`,
    "-p", "21100-21110:21100-21110",
    "-e", `FTP_USER=${FTP_USER}`,
    "-e", `FTP_PASS=${FTP_PASS}`,
    "-e", "PASV_ADDRESS=127.0.0.1",
    "-e", "PASV_MIN_PORT=21100",
    "-e", "PASV_MAX_PORT=21110",
  ])

  if (await $`docker ps --filter name=chest-backup-e2e-ftp -q`.text().then((t) => t.trim())) {
    await Bun.sleep(2000)
  }

  await ensureContainer(NGINX_NAME, "nginx:alpine", ["-p", "8080:80"])

  const pgUp = await ensureContainer(PG_NAME, "postgres:16-alpine", [
    "-e", "POSTGRES_USER=testuser",
    "-e", "POSTGRES_PASSWORD=testpass",
    "-e", "POSTGRES_DB=testdb",
  ])

  if (pgUp) {
    for (let i = 0; i < 10; i++) {
      const ready = await $`docker exec ${PG_NAME} pg_isready -U testuser -d testdb`.nothrow()
        .then((r) => r.exitCode === 0)
      if (ready) break
      await Bun.sleep(1000)
    }

    const seedSql = "/tmp/chest-backup-e2e-seed.sql"
    writeFileSync(seedSql, "CREATE TABLE IF NOT EXISTS widgets (id serial primary key, name text);\nINSERT INTO widgets (name) VALUES ('gadget'), ('sprocket');\n")
    const proc = Bun.spawn(["docker", "exec", "-i", PG_NAME, "psql", "-U", "testuser", "-d", "testdb"], {
      stdin: Bun.file(seedSql),
      stdout: "pipe",
      stderr: "pipe",
    })
    await proc.exited
  }
})

afterAll(async () => {
  for (const name of ["chest-backup-e2e-ftp", NGINX_NAME, PG_NAME]) {
    await $`docker rm -f ${name}`.nothrow().quiet()
  }
  await $`rm -rf ${TEST_DATA_DIR_1} ${TEST_DATA_DIR_2} ${BACKUP_DIR} ${CONFIG_PATH} ${OPEN_CONFIG_PATH} /tmp/chest-backup-e2e-bad-config.json`.nothrow().quiet()
})

describe("E2E Backup", () => {
  test("backup with multiple sources and two destinations", async () => {
    const ftpRunning = await $`docker ps --filter name=chest-backup-e2e-ftp -q`.text()
    writeConfig(Boolean(ftpRunning.trim()))

    const proc = Bun.spawn(["bun", "src/index.ts", "--run-now", "--config", CONFIG_PATH], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()

    console.log("STDOUT:", stdout)

    expect(exitCode).toBe(0)

    const archives = archiveFiles(BACKUP_DIR)
    expect(archives.length).toBeGreaterThanOrEqual(1)
  })

  test("archive contains files from both source directories", async () => {
    const archives = archiveFiles(BACKUP_DIR)
    expect(archives.length).toBeGreaterThanOrEqual(1)

    const latest = archives.sort().reverse()[0]
    expect(latest).toBeDefined()

    const extractDir = "/tmp/chest-backup-e2e-extract"
    mkdirSync(extractDir, { recursive: true })

    if (latest) {
      await $`tar xzf ${join(BACKUP_DIR, latest)} -C ${extractDir}`.quiet()

      const extracted = readdirSync(extractDir, { recursive: true }).map((f) => f.toString())

      expect(extracted.some((f) => f.includes("report.pdf"))).toBe(true)
      expect(extracted.some((f) => f.includes("notes.txt"))).toBe(true)
      expect(extracted.some((f) => f.includes("app.config.yaml"))).toBe(true)
      expect(extracted.some((f) => f.includes("docker-compose.override.yml"))).toBe(true)
    }

    await $`rm -rf ${extractDir}`.nothrow().quiet()
  })

  test("retention keeps only 2 archives after 3 runs", async () => {
    for (let i = 0; i < 3; i++) {
      const proc = Bun.spawn(["bun", "src/index.ts", "--run-now", "--config", CONFIG_PATH], {
        stdout: "pipe",
        stderr: "pipe",
      })
      await proc.exited
    }

    const archives = archiveFiles(BACKUP_DIR)
    expect(archives.length).toBeLessThanOrEqual(2)
  })

  test("dry-run validates config and exits successfully", async () => {
    const proc = Bun.spawn(["bun", "src/index.ts", "--dry-run", "--config", CONFIG_PATH], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)
  })

  test("config validation error exits with non-zero code", async () => {
    const badConfigPath = "/tmp/chest-backup-e2e-bad-config.json"
    writeFileSync(badConfigPath, JSON.stringify({ retention: 7 }, null, 2))

    const proc = Bun.spawn(["bun", "src/index.ts", "--run-now", "--config", badConfigPath], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const exitCode = await proc.exited
    expect(exitCode).toBe(1)
  })

  test("missing config file exits with non-zero code", async () => {
    const proc = Bun.spawn(["bun", "src/index.ts", "--run-now", "--config", "/tmp/chest-backup-e2e-nonexistent.json"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const exitCode = await proc.exited
    expect(exitCode).toBe(1)
  })

  test("daemon mode starts scheduler and responds to SIGTERM", async () => {
    const daemonConfig = {
      schedule: "0 3 * * *",
      retention: 2,
      sources: [{ path: `${TEST_DATA_DIR_1}/*` }],
      destinations: [{ type: "local", path: BACKUP_DIR, parallel: false }],
    }
    const daemonConfigPath = "/tmp/chest-backup-e2e-daemon-config.json"
    writeFileSync(daemonConfigPath, JSON.stringify(daemonConfig, null, 2))

    const proc = Bun.spawn(["bun", "src/index.ts", "--config", daemonConfigPath], {
      stdout: "pipe",
      stderr: "pipe",
    })

    await Bun.sleep(500)

    const exited = await Promise.race([
      proc.exited.then((code) => ({ timedOut: false, code })),
      Bun.sleep(2000).then(() => ({ timedOut: true, code: null })),
    ])

    expect(exited.timedOut).toBe(true)

    proc.kill("SIGTERM")

    const finalCode = await proc.exited
    expect(finalCode).toBe(0)
  })

  test("container lifecycle and database backup", async () => {
    const nginxRunning = await $`docker ps --filter name=${NGINX_NAME} -q`.text().then((t) => t.trim())
    if (!nginxRunning) {
      console.log("nginx container not available, skipping test")
      return
    }

    const pgRunning = await $`docker ps --filter name=${PG_NAME} -q`.text().then((t) => t.trim())
    if (!pgRunning) {
      console.log("Postgres container not available, skipping test")
      return
    }

    writeOpenConfig()

    expect(nginxRunning.length).toBeGreaterThan(0)

    const proc = Bun.spawn(["bun", "src/index.ts", "--run-now", "--config", OPEN_CONFIG_PATH], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    console.log("Container lifecycle test STDOUT:", stdout)

    expect(exitCode).toBe(0)

    const nginxAfter = await $`docker ps --filter name=${NGINX_NAME} -q`.text().then((t) => t.trim())
    expect(nginxAfter.length).toBeGreaterThan(0)

    const archives = archiveFiles(BACKUP_DIR)
    const latest = archives.sort().reverse()[0]
    expect(latest).toBeDefined()

    if (latest) {
      const extractDir = "/tmp/chest-backup-e2e-open-extract"
      mkdirSync(extractDir, { recursive: true })
      await $`tar xzf ${join(BACKUP_DIR, latest)} -C ${extractDir}`.quiet()
      const extracted = readdirSync(extractDir, { recursive: true }).map((f) => f.toString())
      const hasDbDump = extracted.some((f) => f.includes("db-dump"))
      console.log("Extracted files:", extracted)
      expect(hasDbDump).toBe(true)
      await $`rm -rf ${extractDir}`.nothrow().quiet()
    }
  })

  test("backup to real FTP server", async () => {
    const realFtpHost = process.env.E2E_FTP_HOST
    const realFtpPort = process.env.E2E_FTP_PORT ? Number(process.env.E2E_FTP_PORT) : undefined
    const realFtpUser = process.env.E2E_FTP_USER
    const realFtpPass = process.env.E2E_FTP_PASSWORD
    const realFtpPath = process.env.E2E_FTP_PATH ?? "/"

    if (!realFtpHost || !realFtpUser || !realFtpPass) {
      console.log("Skipping real FTP test: set E2E_FTP_HOST, E2E_FTP_USER, E2E_FTP_PASSWORD")
      return
    }

    const config = {
      retention: 2,
      sources: [{ path: `${TEST_DATA_DIR_1}/*` }],
      destinations: [{
        type: "ftp" as const,
        host: realFtpHost,
        port: realFtpPort ?? 21,
        user: realFtpUser,
        password: realFtpPass,
        path: realFtpPath,
        secure: process.env.E2E_FTP_SECURE === "true",
        parallel: false,
      }],
    }

    const { runBackup } = await import("../../src/backup/orchestrator")
    const result = await runBackup(config)

    console.log("Real FTP result:", JSON.stringify(result, (k, v) => k === "password" ? "***" : v, 2))

    expect(result.success).toBe(true)
  })
})
