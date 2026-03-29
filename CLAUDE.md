# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pain Point Studio — a developer research platform for idea validation. Next.js 16 app with Supabase backend, feature-based architecture.

## Commands

| Task                   | Command                                              |
| ---------------------- | ---------------------------------------------------- |
| Dev server + Supabase  | `pnpm run:dev` (requires Docker)                     |
| Dev server only        | `pnpm dev`                                           |
| Build                  | `pnpm build`                                         |
| Lint                   | `pnpm lint`                                          |
| Format check           | `pnpm lint:prettier`                                 |
| Type check             | `pnpm test:types`                                    |
| Unit tests             | `pnpm test:unit`                                     |
| Unit tests + coverage  | `pnpm test:coverage`                                 |
| Single unit test       | `pnpm test:unit -- src/path/to/file.test.ts`         |
| E2E tests              | `pnpm test:e2e` (restarts Supabase, clears .next)    |
| Single E2E test        | `pnpm exec playwright test e2e/path/to/file.spec.ts` |
| Lighthouse audit       | `pnpm test:lighthouse` (builds automatically)        |
| All checks             | `pnpm test:all`                                      |
| Unused code detection  | `pnpm knip`                                          |
| Reset local DB         | `pnpm supabase:reset`                                |
| Generate DB types      | `pnpm supabase:types` → `src/lib/supabase/types.ts`  |
| New migration          | `pnpm supabase:migration:new <name>`                 |
| Preview prod migration | `pnpm supabase:push:dry`                             |

## Tech Stack

- **Next.js 16** with Turbopack, React 19, React Compiler (auto-memoization)
- **Supabase** for auth (OAuth + email), database (Postgres 17), storage
- **next-intl** for i18n — all routes prefixed with `[locale]` (currently `en` only)
- **Tailwind CSS v4** — config in `globals.css` via `@theme`, no `tailwind.config.js`
- **shadcn/ui** (New York style) — components in `src/components/ui/`
- **t3-env** for env validation — env vars are strings, use `z.coerce.number()` for numbers
- **Zod v4** + React Hook Form for form validation
- **Vitest** (unit, v8 coverage) + **Playwright** (E2E: Chromium + WebKit) + **Lighthouse CI**
- **Upstash Redis** for distributed rate limiting (production); in-memory fallback in dev

> For full architecture details, see [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md).

## Architecture

### Feature-based structure (`src/features/`)

7 features: `auth`, `command-palette`, `dashboard`, `marketing`, `projects`, `settings`, `surveys`. Each may contain: `actions/`, `components/`, `config/`, `hooks/`, `lib/`, `types/`.

- Feature-scoped code → `src/features/<feature>/`
- Shared UI primitives → `src/components/ui/`
- Shared composite components → `src/components/shared/`
- Cross-feature hooks → `src/hooks/common/`
- Cross-feature utilities → `src/lib/common/`
- Server actions wrapped with `withProtectedAction` from `src/lib/common/`

### Supabase clients (`src/lib/supabase/`)

- `client.ts` — browser, anon key, RLS-enforced
- `server.ts` — server components/actions, cookie-based sessions
- `admin.ts` — service role, bypasses RLS

### Middleware (`src/proxy.ts`)

Auth session refresh, route protection (protected by default — public routes allowlisted), i18n locale detection, basic auth for preview deploys.

### Routing & i18n

- Routes defined in `src/config/routes.ts`; groups: `(auth)`, `(dashboard)`, `(marketing)`, `(survey)`
- Custom `Link` from `src/i18n/routing` auto-detects sibling routes → uses `replace` instead of `push`

### Status machine

Generic machine in `src/lib/common/status-machine.ts`, configs in `src/features/{projects,surveys}/config/`.

- **Projects**: `active → completed → (readonly)`. Trash from any status. No reopen.
- **Surveys**: `draft → active → completed → (readonly)`. Trash from any status. Trashing an active survey completes it first (irreversible).
- **Completed = readonly**: no editing, no new surveys in completed projects. Can view, export, trash.
- **Soft-delete**: `trashed` status + `deleted_at` + `pre_trash_status`, cron purges after 30 days.
- **Cascade**: completing a project completes active surveys. Trashing a project completes active surveys then trashes everything.

## Conventions

- **Git**: Never execute git write operations (`commit`, `push`, `pull`, `merge`, `rebase`, `gh pr create`). The developer handles all version control. Read-only commands (`status`, `log`, `diff`, `blame`) are fine for context.
- **Testing**: Every file in `**/lib/`, `**/actions/`, `**/hooks/` must have a co-located `.test.ts` file. Only exempt: `index.ts` barrels and pure type-only files.
- **Commits**: conventional only — `feat`, `fix`, `test`, `setup`, `docs`. Pre-commit: lint-staged + `tsc --noEmit`
- **Imports**: `@/*` → `src/*`. Order enforced by prettier: React → Next → Node → third-party → `@/` → relative → CSS
- **Styling**: Tailwind v4 CSS variables (light + dark). Breakpoints: `xs` (400px), `dashboard` (1400px). Fonts: Inter, Source Serif 4, JetBrains Mono (all via `next/font`)
- **Accessibility**: Skip-to-content link on layouts. `aria-live="polite"` on dynamic error messages. `useReducedMotion()` on all motion components. Wrap navbars in `<header>`. Keyboard handlers on drag-and-drop.

## Documentation Upkeep

After any key change (new feature, new env var, new command, architecture change, new convention, dependency addition/removal), update the affected documentation **in the same work session**:

| Change type                                             | Update                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| New/changed command or script                           | `CLAUDE.md` Commands table + `docs/DEVELOPER_GUIDE.md` Section A                                      |
| New env var                                             | `src/lib/common/env.ts` + `.env.example` + `.env.local.example` + `docs/DEVELOPER_GUIDE.md` Section A |
| New dependency (runtime)                                | `docs/DEVELOPER_GUIDE.md` Tech Stack table                                                            |
| Architecture change (new feature, new pattern, routing) | `CLAUDE.md` Architecture section + `docs/DEVELOPER_GUIDE.md` Section B                                |
| Database change (table, RPC, migration)                 | `docs/DEVELOPER_GUIDE.md` Section C                                                                   |
| Auth flow change                                        | `docs/DEVELOPER_GUIDE.md` Section D                                                                   |
| Security change (rate limit, RLS, CSP)                  | `docs/DEVELOPER_GUIDE.md` Section F                                                                   |
| Accessibility pattern change                            | `CLAUDE.md` Conventions + `docs/DEVELOPER_GUIDE.md` Section G                                         |
| Performance optimization                                | `docs/DEVELOPER_GUIDE.md` Section H                                                                   |
| Testing pattern change                                  | `docs/DEVELOPER_GUIDE.md` Section I                                                                   |
| New convention or rule                                  | `CLAUDE.md` Conventions + relevant `.claude/rules/*.md`                                               |

Do **not** create new docs files — all technical documentation lives in `docs/DEVELOPER_GUIDE.md`. `README.md` stays as a quick-start front door.

## Context-specific rules

Detailed rules in `.claude/rules/` load automatically when working on matching paths:

| Rule                   | Loads for                                           | Enforces                                                               |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `code-quality.md`      | **always**                                          | Comments, whitespace, DRY, testing scope, component size, minimal code |
| `feature-structure.md` | `src/features/**`                                   | Feature anatomy, naming, exports, boundaries, schema placement         |
| `server-actions.md`    | `src/features/*/actions/**`                         | Action wrappers, cache(), error handling, useFormAction()              |
| `ui-components.md`     | `src/components/**`, `src/features/*/components/**` | Form sizing, shadcn post-install, button icon sizes                    |
| `supabase.md`          | `supabase/**`, `src/lib/supabase/**`                | Migration workflow, squashing, auth triggers, cron jobs                |
| `e2e-testing.md`       | `e2e/**`                                            | Playwright patterns, WebKit quirks, selector strategy                  |
