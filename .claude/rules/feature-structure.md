---
description: Feature anatomy, naming conventions, barrel exports, cross-feature boundaries
paths:
  - 'src/features/**'
---

# Feature Structure Rules

## Anatomy

```
src/features/<feature>/
├── actions/       # Server actions — each file = one action, barrel index.ts
├── components/    # React components scoped to this feature
├── config/        # Constants, enums, static config — barrel index.ts
├── hooks/         # Custom React hooks
├── lib/           # Pure utility/helper functions
└── types/         # Zod schemas + inferred types — barrel index.ts
```

Not all subdirs required — create only what's needed.

## Naming

| Kind      | File name                    | Export name                                                                 |
| --------- | ---------------------------- | --------------------------------------------------------------------------- |
| Component | `project-avatar.tsx` (kebab) | `export function ProjectAvatar()` (PascalCase)                              |
| Action    | `create-project.ts` (kebab)  | `export const createProject` (camelCase)                                    |
| Hook      | `use-form-action.ts` (kebab) | `export function useFormAction()` (camelCase)                               |
| Config    | `project-status.ts` (kebab)  | `export const PROJECT_STATUS_CONFIG` (SCREAMING_SNAKE)                      |
| Schema    | in `types/` folder           | `export const mySchema` + `export type MySchema = z.infer<typeof mySchema>` |
| Test      | `*.test.ts` / `*.test.tsx`   | —                                                                           |

## Exports

- **Named exports only** — never `export default`
- Barrel `index.ts` required in: `actions/`, `config/`, `types/`
- Barrel optional in: `components/`, `hooks/`, `lib/` (use when 4+ public exports)

## Boundaries

- Features must NOT import from other features — go through shared layers instead:
  - `src/components/ui/` — UI primitives
  - `src/components/shared/` — composite components
  - `src/hooks/common/` — cross-feature hooks
  - `src/lib/common/` — cross-feature utilities
- If two features need the same logic, extract to shared layer

### App Shell Exception

Dashboard layout shell (`src/features/dashboard/components/layout/`) acts as the app
composition boundary. Files in this directory MAY import from other features to compose
the app shell (navbar, chrome, sidebar). This is NOT a general exception — only layout
orchestration files qualify: `dashboard-layout-chrome.tsx`, `navbar.tsx`, `sidebar.tsx`.

## Schemas & Types

- All Zod schemas live in `types/` folder, never inline in components or actions
- Schema + inferred type always exported together
- Split into multiple files when >5 distinct domain concepts; otherwise single `index.ts`

## Components

- `'use client'` directive at top when component uses hooks, state, or event handlers
- Props typed with `interface ComponentProps` (not inline)
