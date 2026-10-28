---
name: rbd
description: 'Rebuild and deploy (rbd) - rebuild all packages, sync to the install dir, and restart the chest-backup service. Trigger: "rbd", "rebuild", "rebuild and reinstall", "deploy", "redeploy", "restart the app".'
---

# Rebuild and Deploy (rbd)

Rebuild every package in this monorepo, make sure the running install picks up the changes, and restart the service so the new build is live.

## How deployment works here

- The install directory `/usr/share/chest-backup` is a **symlink to this repo** (`/home/branko/Desktop/code/chest-backup`). Building in place therefore updates the install location automatically — no separate copy step is needed. Verify this with `readlink -f /usr/share/chest-backup` first; if it is NOT a symlink, run the copy steps below instead.
- The API serves the web UI from `packages/web/dist` (resolved relative to the bundled `packages/api/dist/index.js`). Both must be rebuilt.
- The app runs as a systemd **user** service named `chest-backup` and listens on port 5199.

## Steps

1. **Typecheck + lint** — before building, make sure the code is clean:
   - `npx tsc -b` (run from `packages/web`)
   - `npx eslint packages/` (run from repo root)
   - Fix any errors before continuing. Do not build broken code.

2. **Rebuild all packages** — run from the repo root:
   ```
   pnpm -r build
   ```
   This builds `shared`, `core`, `api` (bun bundle -> `packages/api/dist/index.js`) and `web` (vite -> `packages/web/dist`). Watch for `error` lines in the output.

3. **Sync to install dir** — only needed if `/usr/share/chest-backup` is NOT a symlink to this repo:
   ```
   cp packages/api/dist/index.js /usr/share/chest-backup/packages/api/dist/index.js
   rm -rf /usr/share/chest-backup/packages/web/dist && cp -r packages/web/dist /usr/share/chest-backup/packages/web/
   ```
   If it IS a symlink, skip this — the build already updated it. Confirm with `diff -q packages/web/dist/assets/ /usr/share/chest-backup/packages/web/dist/assets/`.

4. **Restart the service**:
   ```
   systemctl --user restart chest-backup
   ```

5. **Verify** — confirm it is live and serving the new bundle:
   ```
   systemctl --user is-active chest-backup          # expect: active
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5199/destinations   # expect: 200
   curl -s http://localhost:5199/ | grep -o 'assets/index-[^"]*\.js'             # should match packages/web/dist/assets/*.js
   ```
   If the served JS filename does not match the freshly built one, the service did not pick up the build — restart again and re-check.

## Rules

- Always run typecheck/lint before building; fix errors first.
- This IS an explicit restart/deploy request — do NOT wait for separate confirmation to restart the service.
- Do NOT commit changes unless explicitly asked (this is a deploy action, not a git action).
- Report concisely: what was rebuilt, that the install is in sync, service status, and the served bundle hash.
