# chest-backup

A scheduled backup tool for files, Docker containers, and PostgreSQL databases.

## Features

- **File backup** — archive arbitrary paths and files
- **Docker container backups** — backup running containers
- **PostgreSQL database backups** — support for host-connected and Docker-based databases
- **Multiple destinations** — local filesystem and SFTP
- **Cron scheduling** — run backups on a schedule or one-off
- **Retention policies** — automatic cleanup of old backups per destination
- **Discord notifications** — receive alerts on backup success/failure
- **Dry-run mode** — validate configuration without running backups
- **Environment variable interpolation** — reference secrets from `.env` in config

## Quick Start

### Configuration

Copy the example config and adjust it to your needs:

```bash
cp chest-backup.json.example chest-backup.json
```

Edit `chest-backup.json` to define sources, destinations, databases, and schedule.

### Environment Variables

Copy the example environment file and set your secrets:

```bash
cp .env.example .env
```

### Run Locally

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

### Run as Daemon

Configure a `schedule` field in `chest-backup.json` (cron expression) and start the service:

```bash
pnpm start
```

### Docker

```bash
docker compose up -d
```

## Configuration Reference

```jsonc
{
  "schedule": "0 3 * * *",          // cron expression (optional)
  "retention": 7,                    // global retention in days (optional)
  "sources": [                       // files/paths to back up
    { "path": "/data/documents" },
    { "path": "/data/config.yaml" }
  ],
  "destinations": [                  // where to store backups
    {
      "type": "local",
      "path": "/backups/local",
      "retention": 30,               // per-destination retention (optional)
      "parallel": true
    },
    {
      "type": "sftp",
      "host": "backups.example.com",
      "port": 22,
      "user": "backupuser",
      "privateKey": "~/.ssh/backup_key_ed25519",
      "path": "/backups",
      "parallel": false
    }
  ],
  "databases": [                     // PostgreSQL databases to back up
    {
      "type": "host",
      "connectionString": "postgresql://user:pass@host:5432/mydb",
      "database": "mydb"
    },
    {
      "type": "docker",
      "containerName": "my-postgres",
      "database": "mydb",
      "username": "user",
      "password": "${DB_PASSWORD}"
    }
  ],
  "containers": ["my-app", "my-worker"],  // Docker containers to back up
  "notifications": {                 // alerting
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

## Architecture

```
src/
├── backup/      # Backup orchestration, archiving, retention, verification
├── config/      # Config loading, validation, env interpolation
├── destinations/ # Local and SFTP backup destinations
├── database/    # PostgreSQL backups
├── docker/      # Docker container management
├── notification/ # Discord webhook notifications
├── scheduler/   # Cron-based scheduling
├── utils/       # Shared utilities (logging, shell)
├── types/       # TypeScript types
└── index.ts     # Entry point
```

## Development

```bash
# Start dev watcher
pnpm dev

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
