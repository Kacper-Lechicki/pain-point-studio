---
description: Supabase migration workflow, squashing rules, auth triggers, cron jobs
paths:
  - 'supabase/**'
  - 'src/lib/supabase/**'
  - 'scripts/safe-squash.mjs'
  - 'scripts/make-migration-idempotent.mjs'
---

# Supabase Rules

## Migration Workflow

- All schema changes go through migration files — never edit production DB directly
- Each change = new migration (`pnpm supabase:migration:new <name>`), incremental (ALTER, DROP, CREATE)
- `db push` only applies **new** migrations — it never removes old objects. Destructive changes must be explicit (DROP TABLE, ALTER TABLE DROP COLUMN, etc.)
- Before pushing to production: always `pnpm supabase:push:dry` first
- After pushing: verify with `supabase db diff --linked` — output should be empty (except auth triggers)
- After schema changes: regenerate types with `pnpm supabase:types`

## Squashing Rules

- **NEVER squash migrations already on production** — causes drift (new timestamp → old migration reverted → schema objects orphaned)
- `pnpm supabase:migration:squash` uses `scripts/safe-squash.mjs` — checks remote state, aborts if applied migrations affected
- Squash only unpushed migrations: `pnpm supabase:migration:squash --to <version>`
- After squash: `pnpm supabase:reset` to verify
- CI (`ci.yml`) runs `supabase db push --dry-run` on every PR to catch drift

## Auth Schema Triggers (Cloud limitation)

- Supabase Cloud does **not** allow `db push` to create triggers on `auth` schema — silently fails
- Trigger `on_auth_user_created` (→ `public.handle_new_user()` for profile rows) must be created **manually** via Dashboard → SQL Editor
- SQL in `supabase/auth_trigger.sql` — re-run after new project or backup restore
- `scripts/make-migration-idempotent.mjs` strips auth triggers from migrations during squash/CI
- App fallback: auth callback upserts profile if trigger didn't fire

## pg_cron Jobs (Cloud limitation)

- `cron.schedule()` cannot be managed via `db push` — create **manually** via Dashboard → SQL Editor
- SQL in `supabase/cron_jobs.sql` — re-run after new project or backup restore
- Jobs: `cleanup_abandoned_responses` (hourly), `complete_expired_surveys` (15min), `purge_trashed_projects` (hourly), `purge_trashed_surveys` (hourly)
- Locally: cron jobs created by `seed.sql` during `pnpm supabase:reset`
- Verify: `SELECT * FROM cron.job;`

## Commands Reference

| Action            | Command                                         |
| ----------------- | ----------------------------------------------- |
| Reset local DB    | `pnpm supabase:reset`                           |
| New migration     | `pnpm supabase:migration:new <name>`            |
| List migrations   | `pnpm supabase:migration:list`                  |
| Squash unpushed   | `pnpm supabase:migration:squash --to <version>` |
| Generate types    | `pnpm supabase:types`                           |
| Link to prod      | `pnpm supabase:link --project-ref <ref>`        |
| Dry-run push      | `pnpm supabase:push:dry`                        |
| Push to prod      | `pnpm supabase:push`                            |
| Pull remote       | `pnpm supabase:pull`                            |
| Diff local/remote | `pnpm supabase:diff`                            |
