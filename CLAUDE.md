# Claude Instructions

## Git Workflow

- Always create a feature branch before starting any implementation. Never work directly on `master`.
- Branch naming convention: `feat/<short-description>` (e.g., `feat/bootstrap-tanstack-start`)

## Database Safety

- **Before any migration or schema change**, create a fork of the Turso database as backup:
  ```bash
  turso db create <db-name>-backup-YYYYMMDD --from-db <db-name> --group screencasts
  ```
- Only apply migrations after the fork is confirmed. Never run `drizzle-kit push` interactively from Claude — use `drizzle-kit generate` + manual SQL via `turso db shell` instead.
