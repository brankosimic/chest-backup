# chest-backup

A full-stack backup management system — schedule and monitor backups of files, Docker containers, PostgreSQL, and SQLite databases from a web dashboard or CLI.

## Features

- **File backup** — archive arbitrary paths and files
- **SQLite backup** — backup SQLite databases directly or from Docker containers
- **Docker container backups** — backup running containers
- **PostgreSQL database backups** — support for host-connected and Docker-based databases
- **Multiple destinations** — local filesystem and SFTP
- **Cron scheduling** — run backups on a schedule or one-off
- **Retention policies** — automatic cleanup of old backups per destination
- **Discord notifications** — receive alerts on backup success/failure
- **Dry-run mode** — validate configuration without running backups
- **Environment variable interpolation** — reference secrets from `.env` in config
- **Web dashboard** — manage config, view backup history, and monitor status from a browser
- **API server** — programmatic access to backup management and status
- **System tray integration** — quick access from the desktop notification area

## Architecture

```
chest-backup/
├── apps/
│   ├── api/          # Hono API server (Bun) — backup orchestration, scheduling, system tray
│   └── web/          # React + Vite frontend — dashboard, config editor, monitoring
├── packages/
│   └── shared/       # Shared TypeScript types between API and web
├── src/              # CLI app — backup engine (orchestration, archiving, retention)
├── chest-backup.json # Config file
└── .env              # Environment variables (secrets, API config)
```

## Quick Start

### Configuration

Copy the example config and adjust it to your needs:

```bash
cp chest-backup.json.example chest-backup.json
```

Edit `chest-backup.json` to define sources, destinations, and schedule.

### Environment Variables

Copy the example environment file and set your secrets:

```bash
cp .env.example .env
```

### Run Backup (CLI)

```bash
# Install dependencies
pnpm install

# Run a one-off backup
pnpm start -- --run-now

# Run with a custom config path
pnpm start -- --config /path/to/config.json --run-now

# Validate config without running
pnpm start -- --dry-run
```

### Web Dashboard

Start the API server and dev server:

```bash
pnpm dev
```

This starts the API server (port 5199) and the Vite dev server concurrently.
Open the web UI in your browser (default: `http://localhost:5173`).

### Run as Daemon

Configure a `schedule` field in `chest-backup.json` (cron expression) and start the service:

```bash
pnpm start
```

## Configuration Reference

```jsonc
{
  "schedule": "0 3 * * *",                // cron expression (optional)
  "retention": 7,                          // global retention in days (optional, default: 7)
  "tempDir": "/tmp",                       // temporary directory for backup staging (optional, default: /tmp)
  "sources": [                             // backup sources
    { "type": "path", "path": "/data/documents" },
    { "type": "path", "path": "/data/config.yaml", "isFile": true },
    { "type": "sqlite", "path": "/data/app/data.db" },
    { "type": "sqlite-container", "containerName": "sonarr", "dbPath": "/config/sonarr.db" },
    {
      "type": "postgres",
      "host": "db.example.com",
      "port": 5432,
      "user": "dbuser",
      "password": "${DB_PASSWORD}",
      "database": "mydb"
    },
    {
      "type": "postgres-container",
      "containerName": "my-postgres",
      "user": "dbuser",
      "password": "${DB_PASSWORD}",
      "database": "mydb"
    },
    {
      "type": "container-volume",
      "containerName": "my-app",
      "volumePath": "/data",
      "include": ["config", "logs"]        // optional — subpaths within the volume
    }
  ],
  "destinations": [                        // where to store backups
    {
      "type": "local",
      "path": "/backups/local",
      "retention": 30,                     // per-destination retention in days (optional)
      "parallel": true,                    // default: true
      "timeout": 300000,                   // ms (optional)
      "skip": false                        // temporarily disable without removing (optional)
    },
    {
      "type": "sftp",
      "host": "backups.example.com",
      "port": 22,
      "user": "backupuser",
      "privateKey": "~/.ssh/backup_key_ed25519",
      "path": "/backups",
      "retention": 30,
      "parallel": false,
      "timeout": 300000
    }
  ],
  "notifications": {                       // alerting (optional)
    "discord": {
      "webhookUrl": "https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}"
    }
  }
}
```

### CLI Flags

| Flag | Description |
|---|---|
| `--config <path>` | Path to configuration file |
| `--dry-run` | Validate config without running backups |
| `--run-now` | Run a backup immediately |

## API

The API server provides REST endpoints for managing and monitoring backups. It also includes system tray integration for desktop environments.

| Variable | Default | Description |
|---|---|---|
| `API_HOST` | `0.0.0.0` | API server bind address |
| `API_PORT` | `5199` | API server port |
| `CHEST_CONFIG_PATH` | `./chest-backup.json` | Path to config file |

## Development

```bash
# Start API + web dev servers
pnpm dev

# Start only the API
pnpm dev:api

# Start only the web frontend
pnpm dev:web

# Type-check
pnpm build

# Lint
pnpm lint

# Format
pnpm format

# Run tests
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm test:container   # Run tests in Docker
```

## License

Private
