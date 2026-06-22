# ChestBackup — Implementation Plan

## Overview

ChestBackup is a Dockerized Bun/TypeScript CLI application that archives specified files, folders, and PostgreSQL databases into `.tar.gz` files and distributes them to configured destinations (local paths or FTP). It supports container lifecycle management, retention policies, parallel/sequential destinations, Discord notifications, and cron-style scheduling — all driven by a single `chest-backup.json` config file.

---

## 1. Project Scaffolding

### 1.1 Initialization
- Initialize with `bun init`
- **Package:** `@chest-backup/app`
- **Package manager:** pnpm (as required by `.opencode/rules.md`)

### 1.2 Dependencies
| Package | Purpose |
|---|---|
| `zod` | Config validation |
| `cron-parser` | Parse cron expressions for scheduling |
| `basic-ftp` | FTP uploads |
| `pino` | Structured logging |
| `pino-pretty` | Pretty-print logs (dev) |

### 1.3 Dev Dependencies
| Package | Purpose |
|---|---|
| `typescript` | Type checking |
| `eslint` | Linting |
| `prettier` | Formatting |
| `husky` | Git hooks |
| `lint-staged` | Staged file checks |

### 1.4 Config Files Created
- `tsconfig.json` — strict mode, path aliases (`@/*` → `src/*`)
- `eslint.config.js` — flat config with `typescript-eslint`
- `.prettierrc` — consistent formatting
- `.husky/pre-commit` — runs `lint-staged`
- `.lintstagedrc.json` — `tsc --noEmit`, `eslint --fix`, `prettier --write` on staged files
- `.gitignore` — `node_modules`, `dist`, `.env`, backups
- `.dockerignore` — `node_modules`, `test`, `.git`
- `.env.example` — placeholder
- `chest-backup.json.example` — annotated sample configuration

---

## 2. Directory Structure

```
chest-backup/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .husky/
│   └── pre-commit
├── .lintstagedrc.json
├── .gitignore
├── .dockerignore
├── .env.example
├── chest-backup.json.example
├── PLAN.md
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── schema.ts
│   │   └── loader.ts
│   ├── types/
│   │   ├── config.ts
│   │   ├── destination.ts
│   │   └── index.ts
│   ├── backup/
│   │   ├── orchestrator.ts
│   │   ├── archiver.ts
│   │   ├── sources.ts
│   │   └── retention.ts
│   ├── destinations/
│   │   ├── types.ts
│   │   ├── local.ts
│   │   └── ftp.ts
│   ├── database/
│   │   └── postgres.ts
│   ├── docker/
│   │   └── manager.ts
│   ├── notification/
│   │   └── discord.ts
│   ├── scheduler/
│   │   └── cron.ts
│   └── utils/
│       ├── logger.ts
│       └── shell.ts
├── test/
│   ├── unit/
│   │   ├── config.test.ts
│   │   └── retention.test.ts
│   └── e2e/
│       ├── docker-compose.e2e.yml
│       └── backup.test.ts
```

---

## 3. Decisions Made

| # | Question | Decision |
|---|---|---|
| 1 | Retention scope | Global default with per-destination override |
| 2 | FTP security | FTPS explicit TLS as default, plain FTP fallback |
| 3 | pg_dump format | `-Fc` custom format |
| 4 | Config reload | Read once at startup |
| 5 | Archive structure | DB dumps embedded in same `.tar.gz` |
| 6 | Database scope | Omit `database` field to dump all databases |
| 7 | CLI flag | `--dry-run` for validation + connectivity test |
| 8 | Partial failure | Partial success (report both outcomes) |
| 9 | Log destination | stdout only |
| 10 | Cron format | 5-field standard |

---

## 4. Phase-by-Phase Implementation

### Phase 1 — Scaffolding & Tooling

Create all config files, install dependencies, set up Husky + lint-staged, verify `tsc --noEmit`, `eslint`, and `prettier` all pass on a minimal placeholder.

### Phase 2 — Types & Config Validation

**`src/types/config.ts`** — All TypeScript interfaces:
- `Config`: top-level, contains all fields below
- `Source`: `{ path: string }`
- `Destination`: `{ type: "local"|"ftp", path: string, host?, port?, user?, password?, retention?: number, parallel?: boolean }`
- `DatabaseConfig`: `{ type: "host"|"docker", database?: string, connectionString?, containerName?, username?, password? }` — database field optional; when omitted, dump all databases
- `DiscordConfig`: `{ webhookUrl: string }`
- `NotificationsConfig`: `{ discord?: DiscordConfig }`

**`src/config/schema.ts`** — Zod mirrors of above interfaces for runtime validation.
- Custom refinements: mutually exclusive fields
- Safe defaults: `destination.parallel` defaults to `true`; retention from global if per-destination not set

**`src/config/loader.ts`** — Exports `loadConfig(path?: string): Config`
- Reads JSON file (default: `./chest-backup.json`)
- Parses + validates with Zod
- Returns typed `Config` or throws descriptive error

### Phase 3 — Utilities

**`src/utils/logger.ts`** — Pino logger singleton
- Level from `LOG_LEVEL` env var (default `info`)
- Pretty-print in development
- Structured JSON in production

**`src/utils/shell.ts`** — Safe shell command execution
- `exec(command: string, opts?: ExecOpts): Promise<ExecResult>`
- Always uses `Bun.$` or Bun's shell API
- Captures stdout, stderr, exit code
- Configurable timeout (default 5 minutes)
- Logs command and result at debug level

### Phase 4 — Core Backup Engine

**`src/backup/sources.ts`**
- `resolveSources(sources: Source[]): Promise<string[]>` — resolves each source path, expands globs, deduplicates, filters non-existent entries with warning

**`src/backup/archiver.ts`**
- `createArchive(timestamp: string, sources: string[], dbDumps: string[]): Promise<string>` — creates a `.tar.gz` file containing all source files and database dumps at `/tmp/chest-backup-<timestamp>.tar.gz`
- Uses `Bun.$ tar czf` with `-C` for proper relative paths
- Returns the path to the created archive
- Logs file count and total size after creation

**`src/backup/retention.ts`**
- `enforceRetention(destination: Destination, archivePrefix: string, globalRetention: number): Promise<void>`
- Uses destination's `retention` field if set, otherwise falls back to global retention
- Lists files matching pattern at destination
- Parses timestamp from filenames
- Sorts newest-first, keeps N, deletes rest

**`src/backup/orchestrator.ts`** — The main flow:
```typescript
async function runBackup(config: Config): Promise<BackupResult>
```
1. Generate timestamp string
2. **Stop containers** (if configured) via `docker/manager.ts`
3. **Dump databases** (if configured) via `database/postgres.ts` → temp `.dump` files
4. **Resolve sources**
5. **Create archive** with sources + DB dumps
6. **Start containers** back up (always, even if steps 3-5 failed for non-container reasons)
7. **Dispatch to destinations** — parallel or sequential per destination config:
   - Copy archive to destination path
   - Enforce retention (per-destination override or global)
8. **Clean up** temp files
9. **Send notification** — success (with summary) or partial success/failure (with details)
10. Return result summary

### Phase 5 — Destinations

**`src/destinations/types.ts`**
- `DestinationHandler` interface: `store(archivePath: string, dest: Destination): Promise<void>` and `prune(dest: Destination, prefix: string, globalRetention: number): Promise<void>`

**`src/destinations/local.ts`**
- Uses `Bun.write()` or `fs.cpSync` to copy the archive to the destination directory
- Creates destination directory if it doesn't exist

**`src/destinations/ftp.ts`**
- Connects via `basic-ftp`
- FTPS explicit TLS by default, falls back to plain FTP
- Uploads the archive to the remote path
- Close connection on completion/error
- No passwords logged

### Phase 6 — Database Backups

**`src/database/postgres.ts`**
- `dumpHostDatabase(connString: string, dbName: string | undefined, outputPath: string): Promise<void>` — runs `pg_dump <connString> -d <dbName> -Fc -f <outputPath>`; if `dbName` is undefined, uses `--all-databases` or `pg_dumpall`
- `dumpDockerDatabase(containerName: string, dbName: string | undefined, user: string, password: string, outputPath: string): Promise<void>` — runs `docker exec <containerName> pg_dump -U <user> -d <dbName> -Fc -f /tmp/<name>.dump` then copies out; if `dbName` is undefined, uses `pg_dumpall`
- Output path is a temp `.dump` file bundled into the archive

### Phase 7 — Docker Manager

**`src/docker/manager.ts`**
- `stopContainers(names: string[]): Promise<void>` — `docker stop` each, wait briefly, verify stopped
- `startContainers(names: string[]): Promise<void>` — `docker start` each, verify started
- **Recovery:** always restarts containers even if backup fails mid-way
- Requires Docker socket at `/var/run/docker.sock`

### Phase 8 — Notification

**`src/notification/discord.ts`**
- `sendDiscordNotification(webhookUrl: string, result: BackupResult): Promise<void>`
- POSTs JSON payload to Discord webhook
- **Success message**: green embed with timestamp, archive name, size, destinations summary, duration
- **Partial failure**: yellow/orange embed with what succeeded and what failed
- **Failure message**: red embed with error details, which step failed

### Phase 9 — Scheduler & Entry Point

**`src/scheduler/cron.ts`**
- `class Scheduler` — takes cron expression + callback
- Uses `cron-parser` to compute next run time
- Internally uses `setTimeout` loop (not `setInterval`) to avoid drift
- Exposes `start()` and `stop()` methods
- Graceful handling of long-running backups (skips if previous run still active)

**`src/index.ts`**
- Parse CLI args with `process.argv`
  - `--run-now`: execute backup once and exit
  - `--dry-run`: validate config + test connections, no actual backup
  - `--config <path>`: custom config path
  - No args: daemon mode with scheduler
- Load config
- If daemon mode: instantiate `Scheduler`, `process.on("SIGTERM")` to stop gracefully
- If one-shot: run backup, log result, exit with appropriate code

### Phase 10 — Dockerization

**`Dockerfile`**
```dockerfile
FROM oven/bun:latest AS base
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "src/index.ts"]
```

**`docker-compose.yml`**
```yaml
services:
  chest-backup:
    build: .
    volumes:
      - ./chest-backup.json:/app/chest-backup.json:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - backup-data:/var/lib/chest-backup
      - /path/to/data:/data:ro
    environment:
      - LOG_LEVEL=info
      - TZ=UTC
    restart: unless-stopped
```

### Phase 11 — Testing

**Unit tests** (`bun test test/unit/`):
- Config validation: valid config passes, invalid config throws with clear message, default values applied correctly
- Retention logic: sorting, pruning correct number, filename pattern matching, global vs per-destination override
- Archive naming: correct timestamp format

**E2E tests** (`test/e2e/`):

`docker-compose.e2e.yml` with services:
- `postgres`: Postgres with test database and seed data
- `ftp`: `fauria/vsftpd` with test user
- `chest-backup`: the app with a tailored `chest-backup.json` pointing to local + FTP destinations, Postgres DB, retention=2

`backup.test.ts` test scenarios:
1. Create source files in a mounted volume
2. Run backup with `--run-now`
3. Assert: archive exists in local destination
4. Assert: archive uploaded to FTP server
5. Assert: archive contains DB dump (extract and verify)
6. Run backup 3 more times → verify only 2 copies remain (retention=2)
7. Test with container stop/start (dummy nginx)
8. Test failure notification (config validation error)

---

## 5. Config File Schema (`chest-backup.json`)

```jsonc
{
  "$schema": "./chest-backup.schema.json",
  "schedule": "0 3 * * *",
  "retention": 7,
  "sources": [
    { "path": "/data/documents" },
    { "path": "/data/config.yaml" }
  ],
  "destinations": [
    {
      "type": "local",
      "path": "/backups/local",
      "retention": 30,
      "parallel": true
    },
    {
      "type": "ftp",
      "host": "backups.example.com",
      "port": 21,
      "user": "backupuser",
      "password": "${FTP_PASSWORD}",
      "path": "/backups",
      "parallel": false
    }
  ],
  "databases": [
    {
      "type": "host",
      "connectionString": "postgresql://user:pass@host:5432/mydb",
      "database": "mydb"
    },
    {
      "type": "host",
      "connectionString": "postgresql://user:pass@host:5432/",
      "database": null
    },
    {
      "type": "docker",
      "containerName": "my-postgres",
      "database": "mydb",
      "username": "user",
      "password": "${DB_PASSWORD}"
    }
  ],
  "containers": ["my-app", "my-worker"],
  "notifications": {
    "discord": {
      "webhookUrl": "https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}"
    }
  }
}
```

> **Note:** `"${VAR}"` syntax is not env var substitution in JSON. Users should use env var injection at the Docker level (e.g., `envsubst` or Docker Compose variable substitution). The config remains pure JSON; secrets are not stored in it.
