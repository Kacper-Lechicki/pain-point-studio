---
name: new-migration
description: Create a new Supabase migration, apply it locally, and regenerate types
argument-hint: '<migration-name>'
allowed-tools: 'Bash, Read, Write, Edit, Grep, Glob'
---

# New Migration Workflow

Create a new Supabase database migration with the given name.

## Steps

1. Run `pnpm supabase:migration:new $ARGUMENTS` to create the migration file
2. Open the created migration file for the user to see the path
3. Ask the user what SQL to put in the migration (or if they provide it in the prompt, write it directly)
4. After the SQL is written, run `pnpm supabase:reset` to apply all migrations from scratch
5. If reset succeeds, run `pnpm supabase:types` to regenerate TypeScript types
6. Report the result — migration file path, reset status, types regenerated

## Rules

- Never modify existing migrations — only write to the newly created file
- Use IF NOT EXISTS / IF EXISTS for idempotency where appropriate
- Include both UP logic in the migration (Supabase doesn't use down migrations)
