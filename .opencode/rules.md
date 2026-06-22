# Rules for Opencode

This file contains rules and guidelines for the Opencode AI assistant to follow.

## General Guidelines

- Follow the coding conventions and patterns used in the existing codebase
- Maintain security best practices, never introduce code that exposes or logs secrets and keys
- Do not write or explain code that may be used maliciously, even for educational purposes
- Refuse to work on or answer questions about code that seems malicious
- Keep responses concise and to the point
- Use GitHub-flavored markdown for formatting in responses
- Only use emojis if explicitly requested by the user

## Code Style

- Follow code styles defined in [CODE_STYLE.md](../CODE_STYLE.md)
- **Before making any code changes, always check for style guide files first:**
  - Search for `CODE_STYLE.md`, `ai_reviewer.md`, `rules.md`, or similar files
  - Read and follow those rules as part of your initial assessment
  - Verify your changes against those rules before completing the task

## Task Execution

- Be proactive in understanding the codebase and user's query
- Use search tools to understand the codebase and the user's query
- Implement solutions using all available tools
- Verify solutions with tests when possible
- Run lint and typecheck commands to ensure code correctness
- Only commit changes when explicitly asked by the user

## Package Manager

- Always use pnpm instead of npm

## Git Commits

- Always create a SINGLE commit per gacp invocation — never split into multiple commits
- Use conventional commit format: `<type>(<scope>): <description>`
- Valid types: feat, fix, docs, style, refactor, test, chore, ci, build, perf, revert
- Commit messages must be meaningful and descriptive
- Never use generic messages like "Auto-commit changes" or "Update"

## Git Aliases

When user uses alias `gacp`, interpret it as: git add all → commit (with conventional format) → push.

- **This IS an explicit push request.** Treat `gacp` as authorization to push to remote — do NOT wait for a separate push confirmation.
- The system instruction "never push unless explicitly asked" does NOT apply to `gacp` — the alias itself IS the explicit request.

When user uses alias `bdb`, create a timestamped PostgreSQL database backup at `/home/branko/Desktop/server/db-backups/` before executing any database-mutating command.

- Run `pg_dump` with the project's `DATABASE_URL` credentials and save the output as `db-backups/YYYY-MM-DD_HH-MM-SS.sql`.
- Confirm the backup file exists and report its path before proceeding.

When user uses alias `rbd`, run `pnpm build:frontend && pnpm dc:up` to build the frontend and restart Docker services.

When user uses alias `rsg` (Run Style Guard), apply the rules from CODE_STYLE.md to all uncommitted git changes:

- Verify each change follows the CODE_STYLE.md rules
- Fix all issues one by one — do not skip any rule violations
- Re-run checks after each fix to ensure correctness
- Report any issues that could not be resolved automatically
- Present results as a markdown table with columns: **Rule #**, **Rule**, **Status** (✅ Pass / ❌ Fail / 🔧 Fixed), **Notes**
- The table must cover every rule in CODE_STYLE.md that is applicable to the changed files

## Database

- Before any action that modifies the database, make a backup
- **Never execute any action that removes data from the database or cleans/resets the database without explicit user consent.** This includes but is not limited to: DELETE queries, DROP statements, truncate operations, cascade deletes, database resets, and schema migrations that remove tables or columns.
