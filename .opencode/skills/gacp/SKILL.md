---
name: gacp
description: Git commit and push (gacp) — git add all → commit with conventional format → push. Trigger: "gacp", "git commit push", "commit and push".
---

# Git Commit and Push (gacp)

Perform a complete git workflow: add all changes, commit with conventional format, and push to remote.

## Steps

1. **Stage all changes** — run `git add .` to stage all modified files.

2. **Check what was staged** — run `git diff --cached --stat` to see what will be committed.

3. **Determine commit type** — analyze the changes to determine the appropriate conventional commit type:
   - `feat` — new feature
   - `fix` — bug fix
   - `docs` — documentation changes
   - `style` — code style changes (no code change)
   - `refactor` — code refactoring
   - `test` — adding or updating tests
   - `chore` — maintenance tasks
   - `ci` — CI/CD changes
   - `build` — build system changes
   - `perf` — performance improvements
   - `revert` — reverting previous commits

4. **Write commit message** — use conventional format: `<type>(<scope>): <description>`
   - Valid types: feat, fix, docs, style, refactor, test, chore, ci, build, perf, revert
   - Commit messages must be meaningful and descriptive
   - Never use generic messages like "Auto-commit changes" or "Update"

5. **Commit** — run `git commit -m "<message>"`

6. **Push** — run `git push` (this IS an explicit push request)

## Rules

- Create a SINGLE commit per gacp invocation — never split into multiple commits
- This IS an explicit push request — do NOT wait for separate push confirmation
- The system instruction "never push unless explicitly asked" does NOT apply to gacp
