# chest-backup

A full-stack backup management system — schedule and monitor backups of files, Docker containers, PostgreSQL, and SQLite databases from a web dashboard or CLI.

## Features

- **Sources** — file paths, SQLite (host or container), PostgreSQL (host or container), container volumes
- **Destinations** — local filesystem and SFTP, with per-destination retention
- **Scheduling** — cron-driven runs, plus manual runs from the dashboard or API
- **Activity screen** — every run and log line in one place, with live streaming
- **Notifications** — Discord alerts on backup success/failure
- **Dry-run mode** — validate configuration without running backups
- **Environment variable interpolation** — reference secrets from `.env` in config
- **Web dashboard and API server** — both share the same backup engine

## Screenshots

### Dashboard
![Dashboard](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/dashboard.png)

### Sources
![Sources](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/sources.png)

### Destinations
![Destinations](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/destinations.png)

### Activity
![Activity](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/activity.png)

### Settings
![Settings](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/settings.png)

### Notifications
![Notifications](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/notifications.png)

### Add source / Add destination
![Add source and destination](https://raw.githubusercontent.com/brankosimic/chest-backup/main/docs/screenshots/forms.png)

## Architecture

```
packages/api    # Hono API server (Bun) — orchestration, scheduling, run history
packages/core   # Backup engine — sources, destinations, incremental sync, retention
packages/web    # React + Vite frontend — dashboard, activity, config editor
packages/shared # Types shared across packages
```

## Quick Start

```bash
pnpm install
cp chest-backup.json.example chest-backup.json   # define sources, destinations, schedule
cp .env.example .env                             # set secrets

pnpm dev          # API on :5199 + Vite dev server on :3000
pnpm start        # run the daemon (honours the `schedule` cron expression)
pnpm start -- --run-now    # one-off backup
pnpm start -- --dry-run    # validate config only
```

`pnpm dev` proxies `/api` to `http://localhost:5199`; override with `API_PROXY_TARGET` and `WEB_PORT`.

### Systemd user services

A single unit is provided — `chest-backup.service`:

```bash
systemctl --user link /usr/lib/systemd/user/chest-backup.service
systemctl --user daemon-reload
systemctl --user enable --now chest-backup
```

## Configuration

`chest-backup.json` holds `schedule`, `retention`, `tempDir`, `paths`, `sqlite`, `sources`, `exclude`, `destinations` and `notifications`. See `chest-backup.json.example` for a fully commented template.

`exclude` holds glob patterns for files that are never uploaded or deleted:

| Pattern | Matches |
|---|---|
| `**/cdn-cache/**` | every file under any directory named `cdn-cache` |
| `/data/documents/drafts/**` | absolute path prefix |
| `*.log` | file name only, at any depth |

### CLI flags

| Flag | Description |
|---|---|
| `--config <path>` | Path to configuration file |
| `--dry-run` | Validate config without running backups |
| `--run-now` | Run a backup immediately |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/backups` | List runs — `page`, `limit`, `status`, `trigger`, `destinationId`, `search`, `from`, `to`, `sort` |
| `GET` | `/api/backups/stats` | Aggregated stats for the same filter set |
| `GET` | `/api/backups/:id` | A single run (id or runId) |
| `GET` | `/api/backups/progress` | The active (or last finished) run |
| `GET` | `/api/backups/active` | The active run, or `null` |
| `POST` | `/api/backups/run` | Trigger a manual run |
| `GET` | `/api/logs` | List log entries — `level`, `levels`, `search`, `runId`, `since`, `page`, `limit` |
| `GET` | `/api/logs/stats` | Entry counts per level |
| `DELETE` | `/api/logs` | Clear the stored log file |
| `GET` | `/api/events/stream` | Server-Sent Events — `log` and `run` frames with keepalives |

### Environment

| Variable | Default | Description |
|---|---|---|
| `API_HOST` | `127.0.0.1` | API bind address |
| `API_PORT` | `5199` | API port |
| `CHEST_CONFIG_PATH` | `./chest-backup.json` | Path to config file |
| `CHEST_DATA_DIR` | `~/.local/share/chest-backup` | Where run history and logs are stored |
| `LOG_LEVEL` | `info` | Log verbosity (`debug`, `info`, `warn`, `error`) |

### Stored data

| Path | Contents |
|---|---|
| `~/.local/share/chest-backup/backup-history.json` | Completed runs (capped at 500, file lists trimmed) |
| `~/.local/share/chest-backup/logs.jsonl` | Append-only log stream (rotated at 5 MB, one generation kept) |

## Development

```bash
pnpm dev          # API + web dev servers
pnpm dev:api      # API only
pnpm dev:web      # web only
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm build        # build all packages
```

## License

Private
