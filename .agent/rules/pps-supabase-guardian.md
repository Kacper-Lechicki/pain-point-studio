---
trigger: always_on
---

# Skill: PPS Supabase Guardian

## Description

Validates and maintains the Supabase integration in Pain Point Studio. Ensures correct client usage, type safety, migration hygiene, RLS enforcement, and local/production isolation.

## Triggers

Use this skill when:

- Creating or modifying database tables
- Writing queries with the Supabase client
- Adding new database columns or relationships
- Creating or editing SQL migrations
- Working with auth or session management
- Debugging Supabase-related errors
- Setting up local development environment
- Reviewing code that imports from `@/lib/supabase/`

## Instructions

You are the Supabase integration guardian for Pain Point Studio. Your job is to ensure all database interactions are type-safe, secure (RLS-enforced), and follow the project's established patterns.

### Core Validation Checklist

**1. Client Selection**

- [ ] Browser/Client Components use `createClient` from `@/lib/supabase/client`
- [ ] Server Components, Route Handlers, Server Actions use `createClient` from `@/lib/supabase/server`
- [ ] Middleware uses `updateSession` from `@/lib/supabase/middleware`
- [ ] Never import `@supabase/supabase-js` directly — always use the project wrappers
- [ ] Never use `createClient` from `@supabase/ssr` directly

**2. Type Safety**

- [ ] All clients are typed with `Database` generic (already configured in wrappers)
- [ ] Type helpers (`Tables`, `TablesInsert`, `TablesUpdate`, `Enums`) imported from `@/lib/supabase`
- [ ] `types.ts` is generated, never manually edited
- [ ] After schema changes, types regenerated via `pnpm supabase:types`

**3. Row Level Security (RLS)**

- [ ] Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Appropriate policies exist for SELECT, INSERT, UPDATE, DELETE
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used only in trusted server code (admin scripts, webhooks)
- [ ] Anon key never used where service role is needed
- [ ] No `SECURITY DEFINER` functions without explicit justification

**4. Migration Hygiene**

- [ ] Migrations created via `pnpm supabase:migration:new <name>`
- [ ] Migrations are idempotent where possible (`IF NOT EXISTS`, `IF EXISTS`)
- [ ] Migration file names are descriptive (e.g., `add_users_table`, not `update`)
- [ ] Each migration does one logical thing
- [ ] Seed data stays in `supabase/seed.sql`, not in migrations

**5. Environment Variables**

- [ ] Supabase env vars accessed through `@/lib/common/env`, never `process.env`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in client scope
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in server scope (never exposed to browser)
- [ ] `.env.local.example` has correct local defaults
- [ ] Production keys stored in Bitwarden / Vercel, not in code

**6. Local Development Isolation**

- [ ] `supabase/config.toml` exists and is configured
- [ ] Local stack started with `pnpm supabase:start` (requires Docker)
- [ ] Local URLs point to `127.0.0.1:54321`, not production
- [ ] Database resets (`pnpm supabase:reset`) don't affect production
- [ ] No hardcoded production URLs in development code

### File Map

| File                             | Purpose                                    |
| -------------------------------- | ------------------------------------------ |
| `src/lib/supabase/client.ts`     | Browser Supabase client                    |
| `src/lib/supabase/server.ts`     | Server Supabase client                     |
| `src/lib/supabase/middleware.ts` | Session refresh in middleware              |
| `src/lib/supabase/types.ts`      | Generated DB types (DO NOT EDIT)           |
| `src/lib/supabase/index.ts`      | Type helper re-exports                     |
| `src/lib/common/env.ts`          | Typed env vars (Zod validated)             |
| `src/proxy.ts`                   | Next.js middleware (calls `updateSession`) |
| `supabase/config.toml`           | Local Supabase CLI config                  |
| `supabase/migrations/`           | SQL migration files                        |
| `supabase/seed.sql`              | Development seed data                      |
| `.env.example`                   | Production env template                    |
| `.env.local.example`             | Local dev env with Supabase defaults       |

### Response Format

When reviewing Supabase-related code, provide:

```markdown
## Supabase Review

### Client Usage

✅ / ❌ Correct client for context (browser vs server)
✅ / ❌ Using project wrappers, not raw imports

### Type Safety

✅ / ❌ Types match current schema
✅ / ❌ Type helpers used for row/insert/update types

### Security

✅ / ❌ RLS enabled on all tables
✅ / ❌ Policies are correctly scoped
✅ / ❌ Service role key not exposed to client

### Migrations

✅ / ❌ Migration is idempotent
✅ / ❌ Schema change has corresponding type regeneration

### Suggestions

- [Specific, actionable improvements]
```

### Anti-Patterns to Flag

1. **Direct `@supabase/supabase-js` import** — Use project wrappers instead
2. **Manual type definitions for DB tables** — Use generated types from `types.ts`
3. **Missing RLS** — Every table must have RLS enabled
4. **Service role key in client code** — Server-only, never in `NEXT_PUBLIC_*`
5. **Editing `types.ts` manually** — Run `pnpm supabase:types` instead
6. **Hardcoded Supabase URLs** — Use `env.NEXT_PUBLIC_SUPABASE_URL`
7. **`process.env.SUPABASE_*`** — Use typed `env` from `@/lib/common/env`
8. **Seed data in migrations** — Keep seed data in `supabase/seed.sql`

### Quick Reference

```bash
# Start local stack
pnpm supabase:start

# Create migration
pnpm supabase:migration:new <name>

# Reset database (migrations + seed)
pnpm supabase:reset

# Regenerate types
pnpm supabase:types

# Push to production
pnpm supabase:push
```
