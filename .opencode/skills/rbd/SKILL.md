---
name: rbd
description: Rebuild and deploy (rbd) — build frontend and restart Docker services. Trigger: "rbd", "rebuild", "build and deploy".
---

# Rebuild and Deploy (rbd)

Build the frontend and restart Docker services.

## Steps

1. **Build frontend** — run:

   ```bash
   pnpm build:frontend
   ```

2. **Start Docker services** — run:
   ```bash
   pnpm dc:up
   ```

## Rules

- Run both commands sequentially (build first, then dc:up)
- Report success or any errors encountered
