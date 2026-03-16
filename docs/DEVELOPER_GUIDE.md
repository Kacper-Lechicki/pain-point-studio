# Developer Guide — Pain Point Studio

> The single, authoritative technical reference for human developers working on this codebase.
>
> **Maintainer note:** This guide must stay in sync with the codebase. When making a key change (new command, env var, dependency, pattern, convention), update the relevant section here in the same PR. See `CLAUDE.md` → "Documentation Upkeep" for the full change-type → section mapping.

---

## A. Project Overview & Setup

### What is Pain Point Studio?

An idea validation platform for developers. It enables a structured research process — from hypothesis to first feedback — in hours instead of weeks. 70% of side projects fail because they don't solve a real problem. PPS fixes that by providing:

- **Project management** — organize research ideas with status tracking (active → completed → archived)
- **Survey builder** — create multi-question surveys with 5 question types (open text, short text, multiple choice, rating scale, yes/no)
- **Respondent collection** — public survey links (`/r/[slug]`) with fingerprint-based duplicate prevention
- **Analytics** — completion rates, response timelines, per-question breakdowns, auto-generated insights
- **Notes & insights** — rich text notes, AI-suggested insights from survey data, kanban board for organizing findings

### Tech Stack

| Layer             | Technology                             | Version        | Notes                                                         |
| ----------------- | -------------------------------------- | -------------- | ------------------------------------------------------------- |
| Framework         | Next.js                                | 16             | Turbopack dev, React Compiler (auto-memoization)              |
| React             | React                                  | 19             | Server Components, `use` hook, Actions                        |
| Backend           | Supabase                               | Postgres 17    | Auth (OAuth + email), RLS, Storage, Vault                     |
| i18n              | next-intl                              | 4.x            | All routes prefixed with `[locale]` (currently `en` only)     |
| Styling           | Tailwind CSS                           | v4             | Config in `globals.css` via `@theme`, no `tailwind.config.js` |
| UI Components     | shadcn/ui                              | New York style | `src/components/ui/`, radix-ui primitives                     |
| Animations        | motion (framer-motion)                 | 12.x           | `motion/react` imports, `useReducedMotion` support            |
| Rich Text         | TipTap                                 | 3.x            | StarterKit + Image + Placeholder + slash commands             |
| Charts            | Recharts                               | 2.x            | Dynamically imported with skeleton fallbacks                  |
| Image Cropping    | react-easy-crop                        | 5.x            | Avatar uploads with round crop                                |
| QR Codes          | qrcode.react                           | 4.x            | Survey sharing, dynamically imported                          |
| Env Validation    | t3-env                                 | 0.13.x         | `src/lib/common/env.ts`, build-time validation                |
| Schema Validation | Zod                                    | v4             | Schemas in `types/` folders                                   |
| Forms             | React Hook Form                        | 7.x            | With `@hookform/resolvers` for Zod                            |
| Unit Tests        | Vitest                                 | 4.x            | v8 coverage, co-located `.test.ts` files                      |
| E2E Tests         | Playwright                             | 1.58+          | Chromium + WebKit                                             |
| Rate Limiting     | Upstash Redis (prod) / in-memory (dev) | —              | Sliding window via `@upstash/ratelimit`                       |
| Quality Gates     | Lighthouse CI                          | 0.15.x         | Performance, a11y, SEO scoring                                |
| Fonts             | Inter, Source Serif 4, JetBrains Mono  | —              | All via `next/font/google` with `display: 'swap'`             |
| Package Manager   | pnpm                                   | 10+            | Lockfile enforced in CI                                       |
| Linting           | ESLint 9 + Prettier                    | —              | Import sorting via `@trivago/prettier-plugin-sort-imports`    |
| Commits           | Commitlint                             | —              | `feat`, `fix`, `test`, `setup`, `docs` prefixes               |
| Git Hooks         | Husky + lint-staged                    | —              | Pre-commit: prettier + eslint + `tsc --noEmit`                |

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker Desktop (for local Supabase — Postgres, Auth, Storage, Studio)

### Local Setup

```bash
git clone <repo-url>
cp .env.local.example .env.local    # local defaults for Supabase CLI
pnpm install
pnpm run:dev                        # starts Supabase + Next.js concurrently
```

- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (database browser, user management)
- **Inbucket** (email): http://localhost:54324 (catches all local emails — confirmations, password resets)

`pnpm run:dev` uses `concurrently` to run `supabase start` and `next dev` in parallel. If you only need the Next.js server (Supabase already running): `pnpm dev`.

### Environment Variables

All validated at build time via `src/lib/common/env.ts` using `@t3-oss/env-nextjs`. Missing or invalid required vars fail the build. Empty strings treated as `undefined` (so optional vars work with `.env` files).

**Server-side variables:**

| Variable                         | Required | Default | Notes                                                                             |
| -------------------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `NODE_ENV`                       | Yes      | —       | `development` / `test` / `production`                                             |
| `SUPABASE_SERVICE_ROLE_KEY`      | No       | —       | Bypasses RLS. Only needed for admin operations                                    |
| `SUPABASE_AUTH_REDIRECT_URI`     | Yes      | —       | OAuth callback URL (e.g. `http://localhost:3000/auth/callback`)                   |
| `SUPABASE_AUTH_GITHUB_CLIENT_ID` | Yes      | —       | GitHub OAuth app client ID                                                        |
| `SUPABASE_AUTH_GITHUB_SECRET`    | Yes      | —       | GitHub OAuth app secret                                                           |
| `SUPABASE_AUTH_GOOGLE_CLIENT_ID` | Yes      | —       | Google OAuth client ID                                                            |
| `SUPABASE_AUTH_GOOGLE_SECRET`    | Yes      | —       | Google OAuth client secret                                                        |
| `SMTP_HOST`                      | Yes      | —       | Brevo SMTP host                                                                   |
| `SMTP_PORT`                      | Yes      | —       | Brevo SMTP port (coerced to number via `z.coerce.number()`)                       |
| `SMTP_KEY`                       | Yes      | —       | Brevo SMTP API key                                                                |
| `UPSTASH_REDIS_REST_URL`         | No       | —       | Upstash Redis URL for distributed rate limiting                                   |
| `UPSTASH_REDIS_REST_TOKEN`       | No       | —       | Upstash Redis token. Both URL + token required for Redis; falls back to in-memory |
| `BASIC_AUTH_USER`                | No       | —       | Basic Auth username for preview deploy protection                                 |
| `BASIC_AUTH_PASSWORD`            | No       | —       | Basic Auth password. Both user + password required to enable                      |
| `CI`                             | No       | —       | Set to `"true"` to disable rate limiting (for E2E tests)                          |
| `STANDALONE`                     | No       | —       | Set to `"true"` to enable standalone Docker output                                |

**Client-side variables:**

| Variable                               | Required | Notes                                                                |
| -------------------------------------- | -------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Yes      | Must use HTTPS for non-localhost (validated with `z.url().refine()`) |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Yes      | Supabase anon/public key (RLS applies)                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No       | Alternative anon key                                                 |

### Commands

| Task                   | Command                                              | Notes                                                |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Dev server + Supabase  | `pnpm run:dev`                                       | Requires Docker running                              |
| Dev server only        | `pnpm dev`                                           | Supabase must be started separately                  |
| Build                  | `pnpm build`                                         | Fails on type errors                                 |
| Bundle analysis        | `pnpm build:analyze`                                 | Opens `@next/bundle-analyzer` report                 |
| Lint                   | `pnpm lint`                                          | ESLint with strict rules                             |
| Format check           | `pnpm lint:prettier`                                 | Prettier check (no write)                            |
| Format fix             | `pnpm lint:prettier:fix`                             | Prettier write                                       |
| Type check             | `pnpm test:types`                                    | `tsc --noEmit`                                       |
| Unit tests             | `pnpm test:unit`                                     | Vitest in watch mode                                 |
| Unit tests + coverage  | `pnpm test:coverage`                                 | Single run with v8 coverage + thresholds             |
| Single unit test       | `pnpm test:unit -- src/path/to/file.test.ts`         |                                                      |
| E2E tests              | `pnpm test:e2e`                                      | Restarts Supabase, clears `.next`, installs browsers |
| Single E2E test        | `pnpm exec playwright test e2e/path/to/file.spec.ts` |                                                      |
| Lighthouse audit       | `pnpm test:lighthouse`                               | Builds automatically before running                  |
| All checks             | `pnpm test:all`                                      | Build → lint → format → types → unit → E2E           |
| Unused code detection  | `pnpm knip`                                          | Reports unused files, exports, types                 |
| Reset local DB         | `pnpm supabase:reset`                                | Drops and re-creates from migrations                 |
| Generate DB types      | `pnpm supabase:types`                                | Outputs to `src/lib/supabase/types.ts`               |
| New migration          | `pnpm supabase:migration:new <name>`                 | Creates timestamped SQL file                         |
| Squash migrations      | `pnpm supabase:migration:squash`                     | Custom script for safe squashing                     |
| Preview prod migration | `pnpm supabase:push:dry`                             | Dry-run against linked remote                        |

---

## B. Architecture

### Feature-Based Structure

All domain code lives under `src/features/`. 8 features, each self-contained with its own actions, components, hooks, lib, types, and config:

| Feature           | Responsibility                                                                                | Key Files                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth`            | Sign-up, sign-in, OAuth, password reset, identity linking                                     | `actions/sign-in.ts`, `actions/sign-up.ts`, `components/`                                                                                        |
| `command-palette` | Global `Cmd+K` search and navigation, recent projects/surveys groups                          | `components/command-palette.tsx`, `components/command-recent-*-group.tsx`                                                                        |
| `dashboard`       | Overview bento grid, layout shell (sidebar, navbar, sub-panel), recent items tracking         | `components/layout/`, `components/bento/`, `actions/get-recent-items.ts`, `actions/track-recent-item.ts`, `hooks/use-projects-sub-nav-groups.ts` |
| `marketing`       | Landing page sections, charts, public content                                                 | `components/layout/`, `components/charts/`, `config/`                                                                                            |
| `profile`         | Public profile preview and research journey                                                   | `components/profile-header.tsx`, `components/research-journey.tsx`                                                                               |
| `projects`        | Project CRUD, notes (rich text + folders), insights (AI-suggested), overview stats, kanban    | `actions/`, `components/project-dashboard-page.tsx`, `hooks/use-kanban-board.ts`                                                                 |
| `settings`        | Profile editing, email change, password change, connected accounts, account deletion          | `actions/`, `components/profile-form.tsx`, `components/avatar-upload.tsx`                                                                        |
| `surveys`         | Survey builder (question editor), respondent flow (public), analytics (stats, charts, export) | `actions/`, `components/builder/`, `components/respondent/`, `components/stats/`                                                                 |

Internal anatomy of each feature:

```
src/features/<feature>/
├── actions/       # Server actions ("use server") — one file per action, barrel index.ts
├── components/    # React components scoped to this feature
│   └── layout/    # (dashboard only) Shell components: sidebar, navbar, sub-panel
├── config/        # Constants, enums, static config — barrel index.ts
├── hooks/         # Custom React hooks
├── lib/           # Pure utility/helper functions
└── types/         # Zod schemas + inferred TS types — barrel index.ts
```

### Placement Rules

| Kind                                                           | Location                               | Example                                                   |
| -------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Server action for a feature                                    | `features/<feature>/actions/<name>.ts` | `features/projects/actions/create-project.ts`             |
| Component used by one feature                                  | `features/<feature>/components/`       | `features/surveys/components/builder/question-editor.tsx` |
| Shared UI primitives (Button, Dialog, Table…)                  | `src/components/ui/`                   | `components/ui/button.tsx`                                |
| Shared composite components (UserMenu, SettingsSectionHeader…) | `src/components/shared/`               | `components/shared/settings-section-header.tsx`           |
| Hook used by one feature                                       | `features/<feature>/hooks/`            | `features/projects/hooks/use-realtime-project.ts`         |
| Cross-feature hook                                             | `src/hooks/common/`                    | `hooks/common/use-form-action.ts`                         |
| Pure helper for a feature                                      | `features/<feature>/lib/`              | `features/surveys/lib/calculations.ts`                    |
| Cross-feature utility                                          | `src/lib/common/`                      | `lib/common/rate-limit.ts`                                |

### Feature Boundaries

Features must NOT import from other features. Cross-feature code goes through shared layers (`src/components/shared/`, `src/hooks/common/`, `src/lib/common/`).

**Exception:** Dashboard layout shell (`src/features/dashboard/components/layout/`) acts as the app composition boundary. Layout files (`dashboard-layout-chrome.tsx`, `navbar.tsx`, `sidebar.tsx`) MAY import from other features to compose the shell.

### Barrel Export Conventions

- Barrel `index.ts` **required** in: `actions/`, `config/`, `types/`
- Barrel **optional** in: `components/`, `hooks/`, `lib/` (use when 4+ public exports)
- If a barrel re-exports a single item with only 1 consumer, prefer a direct import

### Routing

Routes defined in `src/config/routes.ts` as a nested constant object:

```typescript
ROUTES.auth.signIn; // '/sign-in'
ROUTES.common.dashboard; // '/dashboard'
ROUTES.dashboard.projects; // '/dashboard/projects'
ROUTES.settings.profile; // '/settings/profile'
ROUTES.survey.respond; // '/r' (base path — actual URL is /r/[slug])
```

Four route groups in `src/app/[locale]/`:

| Group         | Purpose                                           | Auth      | Layout                                          |
| ------------- | ------------------------------------------------- | --------- | ----------------------------------------------- |
| `(auth)`      | Sign-in, sign-up, password reset, update password | Public    | Auth navbar (centered, minimal)                 |
| `(dashboard)` | Full app with sidebar                             | Protected | Dashboard chrome (sidebar + navbar + sub-panel) |
| `(marketing)` | Landing page                                      | Public    | Marketing navbar + footer                       |
| `(survey)`    | Respondent flow (`/r/[slug]`)                     | Public    | Minimal (no nav)                                |

Inside `(dashboard)`, three sub-groups:

- `(sidebar)` — Pages with full sidebar (dashboard overview, project detail, survey list)
- `(main)` — Pages without sidebar (settings, profile)
- `(builder)` — Full-screen builder (survey question editor)

**Sibling route groups:** Navigating between routes in the same group uses `replace` instead of `push` to prevent history buildup. Defined in `SIBLING_GROUPS` in `src/config/routes.ts`. Example: sign-in ↔ sign-up ↔ forgot-password.

**Custom Link component** (`src/i18n/link.tsx`): Wraps next-intl's `BaseLink` with automatic sibling detection. Resolves the target href pathname, checks if current and target are in the same `SIBLING_GROUPS` entry, and sets `replace` automatically.

### Middleware Pipeline (`src/proxy.ts`)

Every request (except static assets) passes through this pipeline:

```
Request
  │
  ├─ 1. Session refresh (updateSession)
  │     Creates Supabase server client from request cookies,
  │     calls getUser() to refresh token, propagates Set-Cookie headers.
  │
  ├─ 2. Basic Auth check
  │     If NODE_ENV=production AND BASIC_AUTH_* vars set:
  │     Returns 401 with WWW-Authenticate header if not authenticated.
  │     Uses timing-safe comparison (timingSafeEqual) to prevent side-channels.
  │
  ├─ 3. Route classification
  │     Strips locale prefix, checks against PUBLIC_ROUTES allowlist.
  │     Everything not in PUBLIC_ROUTES is protected.
  │
  ├─ 4. Auth redirect
  │     Unauthenticated user on protected route → redirect to /[locale]/sign-in.
  │     Session cookies forwarded to the redirect response.
  │
  ├─ 5. Dashboard redirect
  │     Authenticated user on home (/) or auth page (sign-in, sign-up, forgot-password)
  │     → redirect to /[locale]/dashboard.
  │
  ├─ 6. i18n middleware
  │     next-intl locale detection and route prefix insertion.
  │
  ├─ 7. Cache headers
  │     Protected pages: Cache-Control: no-store, max-age=0
  │     (prevents bfcache from restoring stale auth state)
  │
  └─ 8. Cookie forwarding
        Supabase session cookies copied to the final response.
```

Matcher excludes: `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml`, image files.

### Supabase Three-Client Pattern (`src/lib/supabase/`)

| Client     | File            | Created With            | Use Case                                                                                                                      |
| ---------- | --------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Browser    | `client.ts`     | `createBrowserClient()` | Client components. Uses anon key, RLS enforced.                                                                               |
| Server     | `server.ts`     | `createServerClient()`  | Server components and actions. Cookie-based sessions via `await cookies()`.                                                   |
| Admin      | `admin.ts`      | `createClient()`        | Service role — bypasses RLS. Only for trusted server code (webhooks, scripts). Throws if `SUPABASE_SERVICE_ROLE_KEY` missing. |
| Middleware | `middleware.ts` | `createServerClient()`  | Session refresh in middleware. Reads request cookies, writes Set-Cookie headers. Returns `{ response, user }`.                |

**Important:** The server client's `setAll` callback wraps `cookieStore.set()` in a try/catch because setting cookies is not allowed in some server contexts (e.g. during rendering). This is expected — Supabase SSR handles it gracefully.

### Server Actions Pattern

Two higher-order functions wrap every server action:

**`withProtectedAction(key, config)`** — For authenticated flows:

```
formData → rate limit check → Zod validation → getUser() auth check → action({ data, user, supabase })
```

- If rate limited → returns `{ error: ERRORS.rateLimitExceeded }`
- If validation fails → returns `{ error: ERRORS.invalidData }`
- If not authenticated → returns `{ error: ERRORS.authRequired }`
- If action throws → returns `{ error: ERRORS.unexpected }`
- `user` is `AppUser` (mapped from Supabase `User` via `mapSupabaseUser()`)

**`withPublicAction(key, config)`** — For unauthenticated flows (respondent, public forms):

```
formData → rate limit check → Zod validation → action({ data, supabase })
```

Same error handling but no auth step. Used by survey respondent actions, sign-in, sign-up.

**`ActionResult<T>`** — Return type for all actions:

- Success: `{ success: true, data: T }` (or `{ success: true }` when `T = undefined`)
- Error: `{ error: string }` (i18n message key)

**Client-side consumption** via `useFormAction()` hook (`src/hooks/common/use-form-action.ts`):

- Manages `isLoading` state
- On error: displays toast with translated error message
- On `ERRORS.authRequired`: redirects to sign-in, refreshes router
- On success: displays optional success toast, calls `onSuccess` callback

### Status Machine

Generic state machine in `src/lib/common/status-machine.ts` shared by projects and surveys. Each feature defines its own:

- **Status config** — Visual config per status (icon, badge variant, CSS classes, i18n keys)
- **Transition map** — Defines valid actions with source statuses and target statuses
- **Action UI config** — Icon, button class, menu item variant, optional confirmation dialog

**Project statuses:** `active` → `completed` → `archived` → `trashed`

| Action            | From                        | To                     | Method |
| ----------------- | --------------------------- | ---------------------- | ------ |
| `complete`        | active                      | completed              | update |
| `archive`         | active, completed           | archived               | update |
| `reopen`          | completed                   | active                 | update |
| `restore`         | archived                    | _(pre_archive_status)_ | update |
| `trash`           | active, completed, archived | trashed                | update |
| `restoreTrash`    | trashed                     | _(pre_trash_status)_   | update |
| `permanentDelete` | trashed                     | —                      | delete |

**Survey statuses:** `draft` → `active` → `completed` / `cancelled` → `archived` → `trashed`

| Action            | From                                          | To                     | Method |
| ----------------- | --------------------------------------------- | ---------------------- | ------ |
| `complete`        | active                                        | completed              | update |
| `cancel`          | active                                        | cancelled              | update |
| `reopen`          | completed, cancelled                          | active                 | update |
| `archive`         | completed, cancelled, draft                   | archived               | update |
| `restore`         | archived                                      | _(pre_archive_status)_ | update |
| `trash`           | draft, active, completed, cancelled, archived | trashed                | update |
| `restoreTrash`    | trashed                                       | _(pre_trash_status)_   | update |
| `permanentDelete` | trashed                                       | —                      | delete |

**Soft-delete lifecycle:** When trashing, the current status is saved in `pre_trash_status` (or `pre_archive_status` for archiving). Restoring reads this field to return to the original state. A database cron job hard-deletes records where `deleted_at` is older than 30 days.

### i18n System

- **Configuration:** `src/i18n/constants.ts` defines `locales` (`['en']`) and `defaultLocale` (`'en'`)
- **Messages:** `src/i18n/messages/en.json` — single file with nested keys (e.g. `projects.detail.archivedBanner`)
- **Server usage:** `const t = await getTranslations()` from `next-intl/server`
- **Client usage:** `const t = useTranslations()` from `next-intl` (requires `'use client'`)
- **Pathnames:** `src/i18n/pathnames.ts` maps route names to locale-specific paths
- **Routing:** `src/i18n/routing.tsx` re-exports `Link`, `usePathname`, `useRouter` with sibling route detection

### Next.js Configuration (`next.config.ts`)

Key settings:

- **React Compiler** enabled (`reactCompiler: true`) — auto-memoization, no manual `useMemo`/`useCallback` needed
- **Typed routes** enabled — catches invalid route paths at build time
- **Standalone output** when `STANDALONE=true` — for Docker deployments
- **`poweredByHeader: false`** — removes `X-Powered-By` header
- **Image optimization:** AVIF/WebP formats, remote patterns for Google/GitHub avatars and Supabase storage
- **Security headers** on all routes:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
  - **CSP:** `default-src 'self'`, allows Supabase origin, Google/GitHub OAuth, WebSocket for Supabase Realtime. `unsafe-eval` only in development (HMR).

---

## C. Database

### Schema Overview

11 tables with Row Level Security. All in `public` schema. Extensions: `pgcrypto`, `supabase_vault`, `uuid-ossp`, `pg_cron`, `pg_net`.

| Table                        | Purpose                                          | Key Columns                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                   | User profile (auto-created on signup)            | `id` (FK → auth.users), `full_name`, `avatar_url`, `pinned_project_id`, `social_links`                                                                                 |
| `projects`                   | Research projects                                | `id`, `user_id`, `name`, `summary`, `status`, `image_url`, `response_limit` (default 50), `deleted_at`, `pre_trash_status`, `pre_archive_status`                       |
| `project_notes`              | Rich text notes                                  | `id`, `project_id`, `folder_id`, `title`, `content` (JSON), `is_pinned`, `position`                                                                                    |
| `project_note_folders`       | Note folder structure                            | `id`, `project_id`, `name`, `position`                                                                                                                                 |
| `project_insights`           | Research insights (user-created or AI-suggested) | `id`, `project_id`, `type` (strength/opportunity/threat/decision), `title`, `description`, `column`                                                                    |
| `insight_suggestion_actions` | Tracks dismissed/accepted AI suggestions         | `id`, `project_id`, `suggestion_hash`, `action`                                                                                                                        |
| `surveys`                    | Survey definitions                               | `id`, `user_id`, `project_id`, `title`, `description`, `slug`, `status`, `visibility`, `max_respondents`, `deadline`, `research_phase`                                 |
| `survey_questions`           | Questions in surveys                             | `id`, `survey_id`, `text`, `type` (question_type enum), `required`, `description`, `config` (JSON), `position`                                                         |
| `survey_responses`           | Response sessions                                | `id`, `survey_id`, `fingerprint`, `device_type`, `status` (in_progress/completed/abandoned), `started_at`, `completed_at`, `contact_name`, `contact_email`, `feedback` |
| `survey_answers`             | Individual answers                               | `id`, `response_id`, `question_id`, `value` (JSON)                                                                                                                     |
| `user_recent_items`          | Recently visited projects/surveys per user       | `id`, `user_id`, `item_id`, `item_type` (project/survey), `visited_at`. Unique on `(user_id, item_id)`.                                                                |

### Database Enums

```sql
question_type: 'open_text' | 'short_text' | 'multiple_choice' | 'rating_scale' | 'yes_no'
survey_status: 'draft' | 'active' | 'completed' | 'cancelled' | 'archived' | 'trashed'
```

### RPC Functions (39 total)

**Auth & User Management:**

- `handle_new_user()` — Trigger on `auth.users` insert; creates `public.profiles` row
- `has_password()` — Checks if user has a password set (vs OAuth-only)
- `verify_password(current_plain_password)` — Validates current password
- `cancel_email_change()` — Reverts pending email change in `auth.users`
- `get_email_change_status()` — Returns email change state
- `get_user_id_by_email(lookup_email)` — Lookup user by email
- `find_user_by_email_excluding(lookup_email, exclude_id)` — Find user excluding given ID (for merge)
- `merge_user_data(from_user_id, to_user_id)` — Migrates data when merging OAuth accounts

**Projects:**

- `change_project_status_with_cascade(p_project_id, p_user_id, p_action)` — Validates transitions, updates status, cascades to surveys (e.g. archiving a project archives its active surveys). Returns JSON error or success.
- `get_projects_list_extras(p_user_id)` — Per-project survey counts, response counts, sparkline data for dashboard list
- `get_project_detail_stats(p_project_id, p_user_id)` — Detailed stats: total surveys, responses, completion rate, response timeline, status distribution
- `get_project_surveys_with_counts(p_user_id, p_project_id)` — Project's surveys with response counts
- `purge_trashed_projects()` — Cron: hard-deletes projects where `deleted_at < now() - 30 days`

**Surveys:**

- `save_survey_questions(p_survey_id, p_user_id, p_questions)` — Bulk upsert: inserts new, updates changed, deletes removed questions in a single transaction
- `start_survey_response(p_survey_id, p_device_type, p_fingerprint)` — Creates response session. Checks: survey is active, not over max respondents, fingerprint not duplicate. Returns response UUID.
- `validate_and_save_answer(p_response_id, p_question_id, p_value)` — Validates answer format against question type, upserts answer row
- `submit_survey_response(p_response_id, p_contact_name, p_contact_email, p_feedback)` — Marks response as completed, stores optional contact info (PII encrypted via Vault)
- `record_survey_view(p_survey_id)` — Increments view counter (fire-and-forget)
- `get_user_surveys_with_counts(p_user_id)` — All user's surveys with response metrics
- `get_survey_stats_data(p_survey_id, p_user_id)` — Per-question aggregated statistics
- `get_survey_completion_timeline(p_survey_id, p_user_id)` — Response count over time
- `get_survey_responses_list(...)` — Paginated response list with 8 filter/sort parameters
- `get_response_detail(p_response_id, p_user_id)` — Single response with all answers
- `get_survey_response_count(p_survey_id)` — Count by status
- `get_export_responses(p_survey_id, p_user_id)` — Full data for CSV/JSON export
- `cleanup_abandoned_responses()` — Cron: removes in-progress responses older than threshold
- `complete_expired_surveys()` — Cron: sets status to 'completed' for surveys past deadline
- `purge_trashed_surveys()` — Cron: hard-deletes trashed surveys older than 30 days

**Encryption:**

- `encrypt_pii(plain_text)` — AES encryption using Supabase Vault secret
- `decrypt_pii(encrypted)` — AES decryption

**Dashboard & Recent Items:**

- `get_dashboard_overview(p_user_id)` — User's projects with active survey counts
- `get_dashboard_stats(p_user_id, p_days)` — KPIs: total responses, completion rate, timeline, recent activity
- `upsert_recent_item(p_item_id, p_item_type)` — Fire-and-forget upsert into `user_recent_items`. Auto-trims to 5 per item type.
- `get_recent_items(p_item_type, p_limit, p_project_id)` — Returns recent items with fresh labels (joins projects/surveys). Filters out trashed/cancelled items. Optional project filter for surveys.

**Other:**

- `get_research_journey(p_user_id)` — Public profile research journey data
- `set_updated_at()` — Trigger function for `updated_at` timestamp auto-update
- `prevent_clearing_required_fields()` — Trigger preventing null updates on required columns

### Auth Trigger

`handle_new_user()` fires on `INSERT` into `auth.users`. Creates a `public.profiles` row with:

- `id` = auth user id
- `full_name` from `raw_user_meta_data` (or email prefix as fallback)
- `avatar_url` from OAuth provider meta

### Cron Jobs (via `pg_cron`)

| Job                         | Schedule | Function                        |
| --------------------------- | -------- | ------------------------------- |
| Purge trashed projects      | Daily    | `purge_trashed_projects()`      |
| Purge trashed surveys       | Daily    | `purge_trashed_surveys()`       |
| Cleanup abandoned responses | Hourly   | `cleanup_abandoned_responses()` |
| Complete expired surveys    | Hourly   | `complete_expired_surveys()`    |

### Migration Workflow

1. `pnpm supabase:migration:new <name>` — creates `supabase/migrations/<timestamp>_<name>.sql`
2. Write idempotent SQL (use `IF NOT EXISTS`, `CREATE OR REPLACE`)
3. `pnpm supabase:reset` — drops local DB and re-applies all migrations
4. `pnpm supabase:types` — regenerates `src/lib/supabase/types.ts` from local schema
5. `pnpm supabase:push:dry` — preview against linked remote (no changes applied)
6. `pnpm supabase:push` — apply to remote (runs `make-migration-idempotent.mjs` first)

**Squashing:** `pnpm supabase:migration:squash` runs a custom script (`scripts/safe-squash.mjs`) that consolidates migrations.

---

## D. Auth System

### Sign-Up Flow

1. User submits email + password via `signUpWithEmail` action
2. Action uses `withPublicAction` with `RATE_LIMITS.authStrict` (3 attempts / 5 min)
3. Supabase `auth.signUp()` called with `emailRedirectTo` pointing to `/auth/callback`
4. **Duplicate detection:** If Supabase returns a user with empty `identities[]`, the email is already registered → error `auth.errors.userAlreadyRegistered`
5. Confirmation email sent (caught by Inbucket locally)
6. User clicks link → `handle_new_user()` trigger creates profile → redirect to dashboard

### Sign-In Flow

1. User submits email + password via `signInWithEmail` action
2. Action uses `withPublicAction` with `RATE_LIMITS.auth` (5 attempts / 5 min)
3. Supabase `auth.signInWithPassword()` called
4. On success, session cookie set → middleware redirects to dashboard on next request

### OAuth Flow (GitHub / Google)

1. `signInWithOAuth(provider)` action (not wrapped — custom rate limiting)
2. Calls `supabase.auth.signInWithOAuth()` with `redirectTo` = `/auth/callback`
3. User redirected to provider → grants access → callback URL receives code
4. `src/app/[locale]/auth/callback/route.ts` exchanges code for session
5. `handle_new_user()` trigger creates profile (if new user) or `merge_user_data()` merges accounts

### Identity Linking

- Users can connect additional OAuth providers to their account from settings
- Connected accounts page shows linked providers with option to unlink
- Unlinking rate-limited with `RATE_LIMITS.sensitiveRelaxed`

### Session Management

- Cookie-based via `@supabase/ssr` — session stored in `sb-<ref>-auth-token` cookie
- Middleware refreshes session on every request via `updateSession()` (silent token refresh)
- Protected pages set `Cache-Control: no-store, max-age=0` to prevent bfcache from restoring stale sessions

### Password Reset

1. User requests reset via `forgotPassword` page → Supabase sends reset email
2. Email link leads to `update-password` page
3. User sets new password via `updatePassword` action (`RATE_LIMITS.sensitiveRelaxed`)

---

## E. Survey Respondent System

### Complete Respondent Flow

```
1. Visit /r/[slug] (public)
     ↓
2. getPublicSurvey(slug) — fetches survey + questions
     ↓ (if not accepting) → SurveyClosed screen
     ↓ (if accepting)
3. recordView(surveyId) — fire-and-forget view counter
     ↓
4. SurveyLanding — title, description, "Start" button
     ↓ (user clicks Start)
5. startResponse({ surveyId, deviceType })
   → computeFingerprint() → start_survey_response RPC
   → returns responseId
     ↓
6. Question-by-question flow:
   For each question:
     → saveAnswer({ responseId, questionId, value })
     → validate_and_save_answer RPC (validates type, upserts)
     ↓
7. submitResponse({ responseId, contactName?, contactEmail?, feedback? })
   → submit_survey_response RPC
   → PII (contactEmail) encrypted via encrypt_pii()
   → response status → 'completed'
     ↓
8. Thank-you screen
```

### Fingerprint Mechanism

Prevents duplicate responses from the same device/IP. Computed in `computeFingerprint()`:

1. **IP available** (from `x-forwarded-for` header): SHA256 hash of `IP:UserAgent:AcceptLanguage:AcceptEncoding`
2. **No IP** → check for `__fp` HTTP-only cookie: use existing fingerprint
3. **No cookie** → generate random fingerprint: SHA256 of `timestamp:random:UserAgent`, set as cookie

Cookie properties: `httpOnly: true, secure: true, sameSite: 'lax', maxAge: 365 days, path: '/'`

The fingerprint is passed to `start_survey_response()` RPC, which checks for duplicates in the `survey_responses` table.

### Question Types

| Type              | `config` JSON                                        | Answer `value` |
| ----------------- | ---------------------------------------------------- | -------------- |
| `open_text`       | `{ maxLength? }`                                     | `string`       |
| `short_text`      | `{ maxLength? }`                                     | `string`       |
| `multiple_choice` | `{ choices: string[], allowMultiple?, allowOther? }` | `string[]`     |
| `rating_scale`    | `{ min, max, minLabel?, maxLabel? }`                 | `number`       |
| `yes_no`          | `{}`                                                 | `boolean`      |

### Rate Limiting (Respondent)

All respondent presets include `includeUserAgent: true` for better shared-IP differentiation:

| Preset             | Limit | Window | Used By                  |
| ------------------ | ----- | ------ | ------------------------ |
| `respondentStart`  | 30    | 5 min  | `startResponse`          |
| `respondentSave`   | 120   | 1 min  | `saveAnswer` (auto-save) |
| `respondentSubmit` | 10    | 5 min  | `submitResponse`         |
| `respondentView`   | 30    | 5 min  | `recordView`             |
| `respondentRead`   | 60    | 1 min  | `getPublicSurvey`        |

---

## F. Security

### Row Level Security (RLS)

All 10 tables have RLS policies. The browser client uses the anon key — every query is filtered by the authenticated user's ID. Service role client (`admin.ts`) bypasses RLS for admin operations.

### Rate Limiting

Two implementations, auto-selected at startup:

- **`UpstashRateLimiter`** — Used when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are both set. Sliding window algorithm via `@upstash/ratelimit`. Limiter instances cached per config key.
- **`InMemoryRateLimiter`** — Fallback. Token bucket with periodic cleanup (every 60s). Disabled in non-production and CI environments.

Both identify clients by `x-forwarded-for` (first IP) or `x-real-ip`. Requests with no IP are treated as rate-limited (to prevent a single shared bucket). Optional `includeUserAgent` appends UA to the key for better differentiation behind NAT.

**All presets** defined in `src/lib/common/rate-limit-presets.ts`:

| Preset             | Limit | Window | Use Case                        |
| ------------------ | ----- | ------ | ------------------------------- |
| `auth`             | 5     | 5 min  | Sign-in, complete-profile       |
| `authStrict`       | 3     | 5 min  | Sign-up only                    |
| `sensitive`        | 3     | 1 hour | Password/email change           |
| `sensitiveRelaxed` | 5     | 1 hour | Password reset, unlink identity |
| `destructive`      | 1     | 1 hour | Delete account                  |
| `crud`             | 10    | 5 min  | Status changes, publish         |
| `frequentSave`     | 60    | 1 min  | Survey questions auto-save      |
| `bulkCreate`       | 20    | 5 min  | Create survey draft             |
| `export`           | 10    | 1 min  | CSV/JSON export                 |
| `upload`           | 10    | 1 min  | Avatar/file upload              |
| `profileUpdate`    | 10    | 5 min  | Profile edits                   |
| `signOut`          | 10    | 1 min  | Sign-out                        |

### Content Security Policy

Configured in `next.config.ts`. Key directives:

- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev for HMR)
- `img-src` allows Google/GitHub avatars and Supabase storage
- `connect-src` allows Supabase REST + WebSocket (Realtime)
- `frame-src` allows Google/GitHub OAuth popups
- `object-src 'none'`, `frame-ancestors 'none'`

### Deploy Protection

Optional Basic Auth for preview environments. Enabled when `NODE_ENV=production` AND both `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set. Uses `timingSafeEqual` (constant-time comparison) to prevent timing side-channel attacks.

### Upload Validation

Defined in `src/config/uploads.ts`:

- Max file size: 5 MB (`IMAGE_MAX_SIZE`)
- Accepted types: `image/jpeg`, `image/png`, `image/webp`

### PII Encryption

Sensitive respondent data (contact email) encrypted at rest via Supabase Vault:

- `encrypt_pii(plain_text)` — AES encryption using a Vault-managed key
- `decrypt_pii(encrypted)` — AES decryption
- Vault key stored in Supabase's encrypted key management, not in application code

---

## G. Accessibility

### Skip-to-Content

- `<a href="#main-content">` in root layout (`src/app/layout.tsx`)
- Visually hidden via `sr-only`, visible on focus via `focus:not-sr-only focus:fixed focus:top-4 focus:left-4`
- `id="main-content"` on `<main>` in dashboard (`dashboard-content.tsx`) and marketing layout

### Reduced Motion

- **CSS:** `@media (prefers-reduced-motion: reduce)` in `globals.css` zeroes all `animation-duration`, `transition-duration`, and forces `scroll-behavior: auto`
- **JavaScript:** `useReducedMotion()` hook from `motion/react` in all motion-heavy components:
  - `page-transition.tsx` — renders plain `<div>` when reduced motion preferred
  - `tabs.tsx` (TabsContent) — skips motion wrapper
  - `sub-panel.tsx` — instant width transition (`duration: 0`)
  - `mobile-nav.tsx` — disables slide animations
  - `create-project-wizard.tsx` — renders plain `<div>` instead of animated step
  - `create-survey-wizard.tsx` — zero-duration transitions

### Screen Reader Support

- `aria-live="polite"` + `role="alert"` on `FormMessage` in `src/components/ui/form.tsx`
- Semantic HTML: navbars wrapped in `<header>` elements (auth navbar, dashboard navbar)
- `SheetTitle` with `sr-only` class for mobile navigation dialog label
- All interactive elements have `aria-label` (buttons, dropdown triggers, checkboxes)

### Keyboard Navigation

- **Sortable lists** (`src/hooks/use-sortable-list.ts`): `handleKeyboardReorder(e, itemId)` — Arrow Up/Down to reorder items
- **Kanban board** (`src/hooks/use-kanban-board.ts`): `handleKeyboardMove(e, itemId, columnId)` — Arrow Up/Down for within-column reorder, Arrow Left/Right to move between columns
- All interactive elements have proper `tabIndex` and `onKeyDown` handlers

### Color Contrast

- Light mode `--muted-foreground: rgb(95, 100, 112)` on white → ~4.58:1 ratio (passes WCAG AA)
- Dark mode `--muted-foreground: rgb(155, 160, 170)` on `rgb(16, 18, 22)` → ~8.8:1 (passes)
- `--disabled-foreground` is intentionally low-contrast (disabled elements are WCAG-exempt per 1.4.3)

---

## H. Performance

### Font Loading

All 3 fonts loaded via `next/font/google` in `src/app/layout.tsx`:

- `Inter` → `--font-sans`
- `JetBrains_Mono` → `--font-mono`
- `Source_Serif_4` → `--font-serif`

All with `display: 'swap'` and `subsets: ['latin']`. CSS variables applied to `<body>`. This eliminates external font requests and prevents CLS.

### Dynamic Imports

Heavy libraries lazy-loaded to reduce initial bundle:

- **`ResponsesChart`** (Recharts) in `dashboard-bento.tsx` — `dynamic()` with skeleton `<div>` fallback
- **`OverviewResponseTrend`** (Recharts) in `project-overview-tab.tsx` — `dynamic()` with skeleton
- **QR code** (`qrcode.react`) in `survey-share-content.tsx` — `dynamic({ ssr: false })`
- **Marketing page sections** — all 6 sections via `dynamic()` with height-matched skeleton placeholders
- **Avatar crop dialog** — `dynamic({ ssr: false })` (dialog-on-demand, `loading: () => null` is acceptable)

### Page Metadata

`generateMetadata()` on key pages:

- Dashboard: `"Dashboard | Pain Point Studio"`
- Project detail: `"{name} — Project | Pain Point Studio"` (dynamic)
- Survey builder: `"{name} — Survey Builder | Pain Point Studio"` (dynamic)
- Settings profile: `"Profile Settings | Pain Point Studio"`
- Survey respondent: dynamic title + description + `openGraph` for social sharing

### Lighthouse CI

Automated quality gate triggered by `run-lighthouse` label on PR:

- Config: `lighthouserc.js` — tests marketing home page (`/`) with desktop preset, 3 runs with median aggregation. Auth pages excluded (blocked by robots.txt by design)
- Thresholds: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- Reports uploaded as CI artifacts (`reports/lighthouse/`)
- GitHub Actions workflow: `.github/workflows/lighthouse.yml`

### Other Optimizations

- **React Compiler** — automatic memoization, no manual `useMemo`/`useCallback` needed
- **`content-visibility: auto`** on marketing sections (CSS in `globals.css`) — defers rendering of off-screen sections
- **Image optimization** — Next.js `<Image>` with AVIF/WebP, remote patterns for avatars
- **Scroll-driven animation** — `animation-timeline: scroll()` for fade effects (CSS-native, no JS)

---

## I. Testing

### Unit Tests

- **Framework:** Vitest 4.x with `@vitejs/plugin-react`, `jsdom` environment
- **Coverage:** v8 provider with `text`, `lcov`, `json-summary` reporters
- **Thresholds:** lines ≥ 41%, functions ≥ 32%, branches ≥ 29% (enforced in CI)
- **Reports:** output to `reports/coverage/` (gitignored)
- **Co-location:** Every file in `lib/`, `actions/`, `hooks/` must have a `.test.ts` beside it. Exempt: `index.ts` barrels and pure type-only files.
- **Path aliases:** `@/` → `src/` (consistent with tsconfig)

**Mocking patterns:**

- Server actions: mock `@/lib/common/env`, `next/headers`, `@/lib/supabase/server`, `@/lib/common/rate-limit`
- Hooks: render with providers using `@testing-library/react`
- Reset modules via `vi.resetModules()` in `beforeEach` for fresh singleton state (rate limiter, etc.)

### E2E Tests

- **Framework:** Playwright 1.58+ (Chromium + WebKit projects)
- **Fixture:** `ensureUser()` creates test users with retry logic for parallel test runs
- **Selectors:** `data-testid` preferred; `[data-sonner-toast]` for toast assertions
- **Patterns:** Full user flows: auth → create project → create survey → add questions → publish → collect response → view stats → cleanup

### CI Workflows

| Workflow   | File                   | Trigger                   | Steps                                                 |
| ---------- | ---------------------- | ------------------------- | ----------------------------------------------------- |
| CI         | `ci.yml`               | Push/PR to main           | Branch name check → install → types → lint → coverage |
| E2E        | `e2e.yml`              | Separate trigger          | Supabase start → build → Playwright tests             |
| Lighthouse | `lighthouse.yml`       | PR label `run-lighthouse` | Build → start → LHCI autorun → upload report          |
| Migrations | `check-migrations.yml` | PR with migration changes | Validates migration SQL                               |

### Coverage Configuration (`vitest.config.mts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'json-summary'],
  reportsDirectory: 'reports/coverage',
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.test.{ts,tsx}',
    'src/lib/supabase/types.ts',  // generated
    'src/**/index.ts',            // barrels
    'src/components/ui/**',       // shadcn (vendor)
  ],
}
```

---

## J. Deployment

### Primary: Vercel

- Automatic preview deploys on every PR
- Production deploy on merge to `main`
- Environment variables configured in Vercel dashboard
- Build command: `pnpm build` (Next.js detects Vercel automatically)

### Alternative: Docker

- Set `STANDALONE=true` → `next.config.ts` enables `output: 'standalone'`
- Produces minimal `standalone/` directory with all dependencies bundled
- Deploy with standard Node.js Docker image

### Required External Services

| Service       | Purpose                                      | Required In                                   |
| ------------- | -------------------------------------------- | --------------------------------------------- |
| Supabase      | Database (Postgres 17), Auth, Storage, Vault | All environments                              |
| Upstash Redis | Distributed rate limiting                    | Production only (falls back to in-memory)     |
| Brevo         | Transactional email (SMTP)                   | All environments (local catches via Inbucket) |

### Database Migrations (Production)

1. `pnpm supabase:push:dry` — preview changes against linked remote
2. `pnpm supabase:push` — runs `make-migration-idempotent.mjs` script, then applies. Auto-reverts migration file changes via `git checkout`.

---

## K. Known Gaps & Future Improvements

- **Visual regression testing** — Chromatic or Percy for component screenshot diffing
- **Dependabot/Renovate** — Automated dependency updates
- **Web Workers** — Heavy computation (image cropping) off main thread
- **ISR** — Incremental Static Regeneration for stable pages (marketing, public profiles)
- **Suspense streaming** — Restructure data-heavy pages (project detail, dashboard) to stream sections independently instead of pre-fetching all data
- **`'use client'` reduction** — ~285 directives; many only use `useTranslations()` which could be converted to server components with `getTranslations()`, reducing client bundle
- **Internationalization** — Currently `en` only; add `pl`, `de` when product matures
