# Supabase Integration

## Overview

Pain Point Studio uses [Supabase](https://supabase.com) as its backend-as-a-service layer, providing PostgreSQL database, auth, and real-time capabilities. The integration is designed for **solo-dev rapid development** with full local/production isolation.

## Architecture

```
src/lib/supabase/
├── client.ts          # Browser client (Client Components)
├── server.ts          # Server client (Server Components, Route Handlers)
├── middleware.ts       # Session refresh in Next.js middleware
├── types.ts           # Generated Database types (do NOT edit manually)
├── index.ts           # Barrel exports for type helpers
├── client.test.ts     # Browser client tests
├── server.test.ts     # Server client tests
└── middleware.test.ts  # Middleware tests

supabase/
├── config.toml        # Local Supabase configuration
├── seed.sql           # Development seed data
└── migrations/        # SQL migration files
    └── 00000000000000_init.sql
```

## Quick Start (Local Development)

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- Node.js ≥ 22, pnpm ≥ 10

### 2. Setup

```bash
# Copy local env defaults
cp .env.local.example .env.local

# Start local Supabase stack (PostgreSQL, Auth, Studio, etc.)
pnpm supabase:start

# Run the app
pnpm dev
```

### 3. Access Local Services

| Service         | URL                          |
| --------------- | ---------------------------- |
| API (REST)      | http://127.0.0.1:54321       |
| Studio (GUI)    | http://127.0.0.1:54323       |
| Inbucket (Mail) | http://127.0.0.1:54324       |
| Database        | postgresql://localhost:54322 |

Open Studio quickly: `pnpm supabase:studio`

## Available Scripts

| Script                        | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `pnpm supabase:start`         | Start local Supabase stack                    |
| `pnpm supabase:stop`          | Stop local Supabase stack                     |
| `pnpm supabase:status`        | Show status of local services                 |
| `pnpm supabase:reset`         | Reset database (re-applies migrations + seed) |
| `pnpm supabase:migration:new` | Create a new migration file                   |
| `pnpm supabase:types`         | Regenerate TypeScript types from local DB     |
| `pnpm supabase:push`          | Push local migrations to remote project       |
| `pnpm supabase:pull`          | Pull remote schema into local migrations      |
| `pnpm supabase:studio`        | Open Supabase Studio in browser               |

## Client Usage

### Browser (Client Components)

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data } = await supabase.from('instruments').select('*');
```

### Server (Server Components, Route Handlers, Server Actions)

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data } = await supabase.from('instruments').select('*');
```

Both clients are fully typed via the `Database` generic from `types.ts`.

## Database Migrations

### Creating a New Migration

```bash
# Create migration file
pnpm supabase:migration:new add_users_table

# Edit the generated file in supabase/migrations/
# Then reset to apply:
pnpm supabase:reset
```

### Regenerating Types

After schema changes, regenerate TypeScript types:

```bash
pnpm supabase:types
```

This overwrites `src/lib/supabase/types.ts`. **Never edit this file manually.**

### Using Type Helpers

```typescript
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase';

// Row type (SELECT results)
type Instrument = Tables<'instruments'>;

// Insert type (INSERT payloads)
type NewInstrument = TablesInsert<'instruments'>;

// Update type (UPDATE payloads)
type InstrumentUpdate = TablesUpdate<'instruments'>;
```

## Environment Variables

| Variable                               | Scope  | Required | Description              |
| -------------------------------------- | ------ | -------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Client | Yes      | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Client | Yes      | Public anonymous key     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | No       | Public publishable key   |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server | No       | Admin key (bypasses RLS) |

For local development, use `.env.local.example` which contains the default keys from `supabase start`.

## Middleware

The `updateSession` function in `src/lib/supabase/middleware.ts` is called from `src/proxy.ts` on every request to:

1. Read auth cookies from the request
2. Refresh expired tokens via `supabase.auth.getUser()`
3. Forward updated cookies to the response

This ensures authenticated sessions stay active across navigation.

## Row Level Security (RLS)

All tables **must** have RLS enabled. Policies control who can read/write data:

```sql
-- Enable RLS on a table
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Example: Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON public.my_table
  FOR SELECT
  USING (auth.uid() = user_id);
```

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use it only in trusted server-side code (e.g., admin scripts, webhooks).

## Working with the Local Database

The local Supabase stack runs entirely in Docker. Your local database is a **sandbox** — you can freely create, modify, and destroy data without any risk to production.

### Inserting Data

There are three ways to load data into your local database:

**1. Seed file (automatic on reset)**

Edit `supabase/seed.sql` to define development data. It runs automatically after every `pnpm supabase:reset`:

```sql
-- supabase/seed.sql
INSERT INTO public.instruments (name) VALUES
  ('Guitar'),
  ('Piano'),
  ('Drums')
ON CONFLICT DO NOTHING;
```

**2. Supabase Studio (GUI)**

Open Studio at http://127.0.0.1:54323 (or `pnpm supabase:studio`) and use the Table Editor to browse, insert, edit, and delete rows visually. This is the fastest way to experiment with data during development.

**3. Direct SQL via psql**

Connect to the local database with `psql` for full SQL access:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Then run any SQL you need:

```sql
INSERT INTO instruments (name) VALUES ('Saxophone');
SELECT * FROM instruments;
```

### Resetting the Database

When you want a clean slate (re-apply all migrations + seed from scratch):

```bash
pnpm supabase:reset
```

This drops all tables, re-runs every migration in `supabase/migrations/`, and then executes `supabase/seed.sql`. Use this whenever:

- You changed an existing migration file
- Your local data is in a broken state
- You want to verify the full migration chain works end-to-end

### Inspecting & Debugging

| Task                 | Command / URL                                                  |
| -------------------- | -------------------------------------------------------------- |
| Browse tables in GUI | http://127.0.0.1:54323 (`pnpm supabase:studio`)                |
| Connect via psql     | `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Check service status | `pnpm supabase:status`                                         |
| View database logs   | `npx supabase db logs`                                         |
| View API logs        | `npx supabase logs api`                                        |
| Check auth emails    | http://127.0.0.1:54324 (Inbucket)                              |

### Testing Migrations Locally

Always test migrations locally before pushing to production:

```bash
# 1. Create migration
pnpm supabase:migration:new add_users_table

# 2. Write SQL in supabase/migrations/<timestamp>_add_users_table.sql

# 3. Apply by resetting (runs all migrations from scratch)
pnpm supabase:reset

# 4. Verify the schema is correct
pnpm supabase:types    # regenerate types
pnpm test:unit         # run tests against new schema
```

## Local vs Production

| Aspect     | Local (`supabase start`)                 | Production (Supabase Cloud)             |
| ---------- | ---------------------------------------- | --------------------------------------- |
| Database   | Docker PostgreSQL on `:54322`            | Managed PostgreSQL (Supabase dashboard) |
| Auth       | Local auth service (Inbucket for emails) | Supabase Auth (real email/OAuth)        |
| Keys       | Static demo keys (safe to commit)        | Unique project keys (never commit)      |
| Data       | Seed data, freely resettable             | Real user data (handle with care)       |
| Migrations | Applied via `pnpm supabase:reset`        | Applied via `pnpm supabase:push`        |
| Storage    | Local file storage in Docker             | Supabase Storage (S3-backed)            |
| URL        | `http://127.0.0.1:54321`                 | `https://<project-id>.supabase.co`      |
| Studio     | http://127.0.0.1:54323                   | https://supabase.com/dashboard          |

### Golden Rules

1. **Never connect `pnpm dev` to a production database.** Local `.env.local` should always point to `127.0.0.1:54321`.
2. **Never use `seed.sql` on production.** Seed data is for development only. Production data should come from real usage or dedicated admin scripts.
3. **Always test migrations locally first.** Run `pnpm supabase:reset` and verify before `pnpm supabase:push`.
4. **Never commit production keys.** Store them in Bitwarden / Vercel environment variables.

### Data Flow Between Environments

```
Local Development                        Production
─────────────────                        ──────────
supabase/migrations/*.sql ──(push)────▶  Supabase Cloud DB
                          ◀──(pull)────  (changes from dashboard)
supabase/seed.sql         ──(local only, never pushed)
src/lib/supabase/types.ts ──(generated from local, committed to git)
.env.local                ──(local only)
.env (Vercel)             ◀──(production keys from Bitwarden)
```

| Command                   | Direction        | What it does                                           |
| ------------------------- | ---------------- | ------------------------------------------------------ |
| `pnpm supabase:push`      | Local → Remote   | Applies unapplied migrations to production             |
| `pnpm supabase:pull`      | Remote → Local   | Captures remote schema diff as new migration file      |
| `npx supabase db diff -f` | Local DB → File  | Captures local GUI changes as new migration file       |
| `pnpm supabase:reset`     | Files → Local DB | Drops everything, re-applies all migrations + seed     |
| `pnpm supabase:types`     | Local DB → Types | Regenerates TypeScript types from current local schema |

## Development Workflows

### Workflow 1: Visual editing in Studio (recommended for prototyping)

The fastest way to iterate on schema. You click in the GUI, then capture the changes as a migration.

```bash
# 1. Start the local stack
pnpm supabase:start

# 2. Open Studio — visual table editor
pnpm supabase:studio
# → http://127.0.0.1:54323

# 3. Make your changes in the GUI:
#    - Create tables, add columns, set constraints
#    - Edit RLS policies
#    - Add indexes

# 4. Capture changes as a migration file
npx supabase db diff -f add_users_table
# → Creates: supabase/migrations/<timestamp>_add_users_table.sql

# 5. Review the generated SQL
#    Open the file and verify it looks correct.
#    The CLI generates the diff between your migration files
#    and the actual local database state.

# 6. Test from scratch (proves migrations are reproducible)
pnpm supabase:reset

# 7. Regenerate TypeScript types
pnpm supabase:types

# 8. Verify everything compiles
pnpm test:unit

# 9. Push to production (when ready)
pnpm supabase:push
```

**How `db diff` works under the hood:**

1. Spins up a temporary "shadow" database on port 54320
2. Applies all existing migration files to the shadow DB
3. Compares the shadow DB against your running local DB
4. Outputs the SQL diff (what changed since last migration)
5. Saves it as a new migration file with `-f` flag

This means your GUI changes are captured precisely — nothing is lost.

### Workflow 2: Manual SQL migration (precise control)

For cases where you know exactly what SQL you want — e.g., adding a specific index, modifying a constraint, or writing a complex migration.

```bash
# 1. Create an empty migration file
pnpm supabase:migration:new add_email_to_users

# 2. Edit the generated file
#    supabase/migrations/<timestamp>_add_email_to_users.sql
#    Write your SQL manually:
#
#    ALTER TABLE public.users ADD COLUMN email TEXT;
#    CREATE UNIQUE INDEX users_email_idx ON public.users (email);

# 3. Apply and test
pnpm supabase:reset     # re-apply all migrations from scratch
pnpm supabase:types     # regenerate types
pnpm test:unit          # verify code compiles

# 4. Push to production
pnpm supabase:push
```

### Workflow 3: Syncing from production to local

When someone made changes directly in the Supabase Cloud dashboard (e.g., added a table via the UI, modified a column), and you need to pull those changes back into your local migration files.

```bash
# 1. Pull the remote schema diff as a migration
pnpm supabase:pull
# → Creates: supabase/migrations/<timestamp>_remote.sql
# → Contains SQL representing the diff between your local
#    migration files and the actual remote database state.

# 2. Review the generated migration
#    Open the file and verify it makes sense.
#    Rename it to something descriptive if needed.

# 3. Apply locally and regenerate types
pnpm supabase:reset     # re-apply all migrations (including the new one)
pnpm supabase:types     # regenerate TypeScript types

# 4. Test
pnpm test:unit

# 5. Commit — the production schema is now captured in version control
#    From now on, all environments can reproduce it from migration files.
```

**Pulling production data (optional):**

If you also need the actual data from production (not just schema), you can use `pg_dump`:

```bash
# Get connection string from Supabase dashboard → Settings → Database
pg_dump --data-only --no-owner \
  "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" \
  > production_data.sql

# Import into local
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < production_data.sql
```

> **Warning:** Be careful with production data — it may contain PII (personal data) subject to GDPR or other privacy regulations. Never commit production data dumps to git.

> **Warning:** `supabase db pull` is a one-time snapshot, not a continuous sync. If you have local migrations that weren't pushed yet, they may conflict with the pulled migration. Always push your local changes first, or start from a clean state.

### Recommendation

| Scenario                             | Use                         |
| ------------------------------------ | --------------------------- |
| Prototyping new tables/columns       | Workflow 1 (Studio + diff)  |
| Precise schema changes               | Workflow 2 (manual SQL)     |
| Someone edited production dashboard  | Workflow 3 (pull)           |
| Production needs initial/lookup data | Dedicated migration (below) |

### Production Seeding

If you need initial data on production (e.g., lookup tables, default settings), create a **dedicated migration** instead of using `seed.sql`:

```bash
pnpm supabase:migration:new seed_default_categories
```

```sql
-- supabase/migrations/<timestamp>_seed_default_categories.sql
INSERT INTO public.categories (name, slug) VALUES
  ('Research', 'research'),
  ('Validation', 'validation'),
  ('Analysis', 'analysis')
ON CONFLICT (slug) DO NOTHING;
```

This ensures production data is versioned, idempotent, and applied automatically via `supabase:push`. Never use `seed.sql` for production — it's local-only.

## Migrating to a Custom Database

The current Supabase integration is designed to be **portable**. If you ever need to move away from Supabase Cloud (self-hosting, compliance, cost, vendor independence), here is what changes and what stays.

### When to Consider Migration

- **Self-hosting requirements** — data must live on your own infrastructure
- **Compliance** — GDPR, HIPAA, or other regulations requiring specific data residency
- **Cost optimization** — at scale, managed PostgreSQL (e.g., AWS RDS, Neon, Railway) may be cheaper
- **Vendor independence** — reducing dependency on a single provider

### What Stays (Portable)

| Component       | Why It's Portable                                                 |
| --------------- | ----------------------------------------------------------------- |
| SQL migrations  | Pure PostgreSQL SQL — works on any Postgres instance              |
| RLS policies    | Native PostgreSQL feature, not Supabase-specific                  |
| Database schema | Standard `CREATE TABLE`, indexes, constraints                     |
| Seed data       | Plain SQL inserts                                                 |
| Type generation | Can regenerate from any PostgreSQL source (Prisma, Drizzle, etc.) |

### What Needs to Change

| Component             | Current (Supabase)                        | Replacement                                          |
| --------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Client library        | `@supabase/ssr`, `@supabase/supabase-js`  | `pg`, Drizzle ORM, Prisma, or Kysely                 |
| Client wrappers       | `src/lib/supabase/client.ts`, `server.ts` | New DB client wrappers (same pattern, different lib) |
| Middleware (auth)     | `src/lib/supabase/middleware.ts`          | NextAuth.js, Clerk, Auth.js, or custom JWT           |
| Auth provider         | Supabase Auth                             | NextAuth, Clerk, Auth0, or self-hosted Keycloak      |
| Type generation       | `supabase gen types`                      | `prisma generate`, `drizzle-kit generate`, or custom |
| Environment variables | `NEXT_PUBLIC_SUPABASE_URL`, etc.          | `DATABASE_URL`, provider-specific auth vars          |
| Local dev stack       | `supabase start` (Docker)                 | `docker compose` with PostgreSQL + auth service      |
| Storage               | Supabase Storage                          | S3, Cloudflare R2, or local filesystem               |

### Migration Checklist

1. **Set up new PostgreSQL instance** (self-hosted, RDS, Neon, PlanetScale, etc.)
2. **Run existing migrations** against the new database — they are pure SQL and should work as-is
3. **Choose a new ORM/query builder** (Drizzle recommended for type safety similar to Supabase)
4. **Replace client wrappers** — rewrite `client.ts` and `server.ts` to use the new library
5. **Replace auth** — remove `@supabase/ssr`, set up NextAuth.js or similar
6. **Update middleware** — replace `updateSession` with new auth session management
7. **Regenerate types** — use the new ORM's type generation (e.g., `prisma generate`)
8. **Update env vars** — replace Supabase-specific vars with `DATABASE_URL` + auth provider vars
9. **Update `.env.local.example` and `.env.example`** with new variable names
10. **Migrate data** — export from Supabase (`pg_dump`) and import to new database (`pg_restore`)
11. **Update tests** — adjust mocks in `client.test.ts`, `server.test.ts`, `middleware.test.ts`
12. **Update documentation** — rewrite this file and `.agent/rules/pps-supabase-guardian.md`

### Important Notes

- **RLS policies will carry over** to any standard PostgreSQL. They are not Supabase-specific.
- **Supabase Auth is the hardest part to replace.** It manages users, sessions, JWT tokens, OAuth, and magic links. Plan this carefully.
- **The migration doesn't have to be all-or-nothing.** You can keep Supabase Auth while moving the database, or vice versa.
- **`supabase/migrations/` folder remains useful** regardless of provider — it's just SQL files that any migration tool can run.
