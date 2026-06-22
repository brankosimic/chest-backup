---
name: rsg
description: Run Style Guard (rsg) — apply CODE_STYLE.md rules to all uncommitted git changes. Trigger: "rsg", "Run Style Guard", "style guard", "check code style".
---

# Run Style Guard (rsg)

Apply the rules from CODE_STYLE.md to all uncommitted git changes in the repository.

## Steps

1. **Read CODE_STYLE.md** — located at the project root (e.g., `CODE_STYLE.md` or `backend/CODE_STYLE.md`). Read every rule.

2. **Get uncommitted changes** — run `git diff --name-only` and `git diff --name-only --cached` to find all changed files (staged and unstaged).

3. **Read each changed file** — load every file that has uncommitted changes.

4. **Check each rule** — systematically verify every rule from CODE_STYLE.md against the changed code. For each rule:
   - If the rule is applicable to the changed files, check it
   - If a violation is found, fix it immediately

5. **Fix all violations** — do not skip any. Apply fixes using ast_grep, edit, or direct file edits. Verify each fix with lsp_diagnostics.

6. **Report results** — present a markdown table with columns:

   | Rule # | Rule | Status | Notes |
   | ------ | ---- | ------ | ----- |
   - **Rule #**: Number from CODE_STYLE.md
   - **Rule**: Brief description of the rule
   - **Status**: `✅ Pass` / `❌ Fail` / `🔧 Fixed`
   - **Notes**: Brief explanation

   The table must cover every rule in CODE_STYLE.md that is applicable to the changed files.

## Rules

- Do NOT commit changes unless explicitly asked
- Do NOT modify files outside of uncommitted changes
- Do NOT skip any rule violations
- Do NOT report a rule as passing if it was not actually checked
- Re-run checks after each fix to ensure correctness

## Context

- Project root: `/home/branko/Desktop/server/code/racuni`
- CODE_STYLE.md location: `/home/branko/Desktop/server/code/racuni/CODE_STYLE.md`
- This is a monorepo with `backend/`, `frontend/`, and `mobile/` subdirectories
