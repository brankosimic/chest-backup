import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { $ } from "bun"

export const E2E = {
  TEST_DATA_DIR_1: "/tmp/chest-backup-e2e-data/docs",
  TEST_DATA_DIR_2: "/tmp/chest-backup-e2e-data/configs",
  BACKUP_DIR: "/tmp/chest-backup-e2e-backups",
  CONFIG_PATH: "/tmp/chest-backup-e2e-config.json",
  OPEN_CONFIG_PATH: "/tmp/chest-backup-e2e-open-config.json",

  FTP_HOST: process.env.E2E_FTP_HOST ?? "127.0.0.1",
  FTP_PORT: process.env.E2E_FTP_PORT ? Number(process.env.E2E_FTP_PORT) : 2121,
  FTP_USER: process.env.E2E_FTP_USER ?? "testftp",
  FTP_PASS: process.env.E2E_FTP_PASSWORD ?? "testftppass",
  PG_NAME: process.env.E2E_PG_CONTAINER ?? "chest-backup-e2e-pg",

  DISCORD_WEBHOOK_URL: process.env.E2E_DISCORD_WEBHOOK_URL,
  REAL_FTP_HOST: process.env.E2E_REAL_FTP_HOST,
  REAL_FTP_PORT: process.env.E2E_REAL_FTP_PORT ? Number(process.env.E2E_REAL_FTP_PORT) : 21,
  REAL_FTP_USER: process.env.E2E_REAL_FTP_USER,
  REAL_FTP_PASSWORD: process.env.E2E_REAL_FTP_PASSWORD,
  REAL_FTP_PATH: process.env.E2E_REAL_FTP_PATH ?? "/",
  REAL_FTP_SECURE: (() => {
    const raw = process.env.E2E_REAL_FTP_SECURE
    return raw === "true" ? true : raw === "implicit" ? ("implicit" as const) : undefined
  })(),
  REAL_FTP_SECURE_OPTIONS: process.env.E2E_REAL_FTP_SECURE_OPTIONS
    ? (JSON.parse(process.env.E2E_REAL_FTP_SECURE_OPTIONS) as Record<string, unknown>)
    : undefined,

  waitForPort: async (host: string, port: number, timeoutMs = 30_000): Promise<boolean> => {
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
      try {
        await Bun.connect({
          hostname: host,
          port,
          socket: {
            open(tcp) {
              tcp.end()
            },
            close() {},
            data() {},
            drain() {},
          },
        })
        return true
      } catch {
        await Bun.sleep(500)
      }
    }
    return false
  },

  archiveFiles(dir: string): string[] {
    if (!existsSync(dir)) return []
    return readdirSync(dir).filter((f) => f.startsWith("chest-backup-") && f.endsWith(".tar.gz"))
  },

  writeConfig(): void {
    const config = {
      retention: 2,
      sources: [{ path: `${E2E.TEST_DATA_DIR_1}/*` }, { path: `${E2E.TEST_DATA_DIR_2}/*` }],
      destinations: [
        { type: "local", path: E2E.BACKUP_DIR, parallel: false },
        { type: "ftp", host: E2E.FTP_HOST, port: E2E.FTP_PORT, user: E2E.FTP_USER, password: E2E.FTP_PASS, path: "/", parallel: true },
      ],
    }

    writeFileSync(E2E.CONFIG_PATH, JSON.stringify(config, null, 2))
  },

  writeOpenConfig(): void {
    const config = {
      retention: 2,
      sources: [{ path: `${E2E.TEST_DATA_DIR_1}/*` }, { path: `${E2E.TEST_DATA_DIR_2}/*` }],
      destinations: [{ type: "local", path: E2E.BACKUP_DIR, parallel: false }],
      databases: [
        {
          type: "docker",
          containerName: E2E.PG_NAME,
          database: "testdb",
          username: "testuser",
          password: "testpass",
        },
      ],
    }

    writeFileSync(E2E.OPEN_CONFIG_PATH, JSON.stringify(config, null, 2))
  },

  writeTestData(): void {
    writeFileSync(join(E2E.TEST_DATA_DIR_1, "report.pdf"), "fake pdf content")
    writeFileSync(join(E2E.TEST_DATA_DIR_1, "notes.txt"), "some notes")
    writeFileSync(join(E2E.TEST_DATA_DIR_2, "app.config.yaml"), "key: value\n")
    writeFileSync(
      join(E2E.TEST_DATA_DIR_2, "docker-compose.override.yml"),
      'services:\n  web:\n    ports:\n      - "8080:80"\n',
    )
  },

  spawnBackup(args: string[]) {
    return Bun.spawn(["bun", "src/index.ts", ...args], { stdout: "pipe", stderr: "pipe" })
  },

  async setupE2E(): Promise<void> {
    mkdirSync(E2E.TEST_DATA_DIR_1, { recursive: true })
    mkdirSync(E2E.TEST_DATA_DIR_2, { recursive: true })
    mkdirSync(E2E.BACKUP_DIR, { recursive: true })

    E2E.writeTestData()

    const ftpReady = await E2E.waitForPort(E2E.FTP_HOST, E2E.FTP_PORT)
    if (!ftpReady) throw new Error(`FTP server not reachable at ${E2E.FTP_HOST}:${E2E.FTP_PORT}`)

    const seedSql = "/tmp/chest-backup-e2e-seed.sql"
    writeFileSync(
      seedSql,
      "CREATE TABLE IF NOT EXISTS widgets (id serial primary key, name text);\nINSERT INTO widgets (name) VALUES ('gadget'), ('sprocket');\n",
    )
    const seed = Bun.spawn(["docker", "exec", "-i", E2E.PG_NAME, "psql", "-U", "testuser", "-d", "testdb"], {
      stdin: Bun.file(seedSql),
      stdout: "pipe",
      stderr: "pipe",
    })
    const seedExit = await seed.exited
    if (seedExit !== 0) {
      const stderr = await new Response(seed.stderr).text()
      throw new Error(`Failed to seed PostgreSQL: ${stderr}`)
    }
  },

  async teardownE2E(): Promise<void> {
    await $`rm -rf ${E2E.TEST_DATA_DIR_1} ${E2E.TEST_DATA_DIR_2} ${E2E.BACKUP_DIR} ${E2E.CONFIG_PATH} ${E2E.OPEN_CONFIG_PATH} /tmp/chest-backup-e2e-bad-config.json /tmp/chest-backup-e2e-seed.sql`
      .nothrow()
      .quiet()
  },
}
