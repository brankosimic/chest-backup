---
name: bdb
description: Database backup (bdb) — create a timestamped PostgreSQL backup before database-mutating commands. Trigger: "bdb", "backup database", "before db".
---

# Database Backup (bdb)

Create a timestamped PostgreSQL database backup before executing any database-mutating command.

## Steps

1. **Ensure backup directory exists** — create `/home/branko/Desktop/server/db-backups/` if it doesn't exist:

   ```bash
   mkdir -p /home/branko/Desktop/server/db-backups/
   ```

2. **Read DATABASE_URL** — get the database connection string from `.env` or `.env.local`:

   ```bash
   grep DATABASE_URL .env
   ```

3. **Run pg_dump** — use the DATABASE_URL credentials to create a backup:

  ```bash
    TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S) && pg_dump "$(grep DATABASE_URL .env | cut -d= -f2-)" -f "/home/branko/Desktop/server/db-backups/platko_${TIMESTAMP}.sql" && echo "Backup created: platko_${TIMESTAMP}.sql" && ls -lh "/home/branko/Desktop/server/db-backups/platko_${TIMESTAMP}.sql"
    ```

4. **Report the backup** — confirm the backup file exists and report its full path before proceeding.

## Rules

- Always create the backup BEFORE any database-mutating command
- Backup filename format: `platko_YYYY-MM-DD_HH-MM-SS.sql`
- Confirm the backup file exists and report its path before proceeding
- If DATABASE_URL is not found, ask the user for the connection string
