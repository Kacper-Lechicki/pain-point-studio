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
| Single unit test       | `pnpm test:unit -- src/path/to/file.test.ts`         |
| E2E tests              | `pnpm test:e2e` (restarts Supabase, clears .next)    |
| Single E2E test        | `pnpm exec playwright test e2e/path/to/file.spec.ts` |
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
- **Vitest** (unit) + **Playwright** (E2E: Chromium + WebKit)

## Architecture

### Feature-based structure (`src/features/`)

8 features: `auth`, `command-palette`, `dashboard`, `marketing`, `profile`, `projects`, `settings`, `surveys`. Each may contain: `actions/`, `components/`, `config/`, `hooks/`, `lib/`, `types/`.

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

Generic machine in `src/lib/common/status-machine.ts`, configs in `src/features/{projects,surveys}/config/`. Soft-delete: `trashed` status + `deleted_at` + `pre_trash_status`, cron purges after 30 days.

## Conventions

- **Git**: Never execute git write operations (`commit`, `push`, `pull`, `merge`, `rebase`, `gh pr create`). The developer handles all version control. Read-only commands (`status`, `log`, `diff`, `blame`) are fine for context.
- **Testing**: Every file in `**/lib/`, `**/actions/`, `**/hooks/` must have a co-located `.test.ts` file. Only exempt: `index.ts` barrels and pure type-only files.
- **Commits**: conventional only — `feat`, `fix`, `test`, `setup`, `docs`. Pre-commit: lint-staged + `tsc --noEmit`
- **Imports**: `@/*` → `src/*`. Order enforced by prettier: React → Next → Node → third-party → `@/` → relative → CSS
- **Styling**: Tailwind v4 CSS variables (light + dark). Breakpoints: `xs` (400px), `dashboard` (1400px). Fonts: Inter, Source Serif 4, JetBrains Mono

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
