# Project Structure

## Feature-based architecture

All domain code lives under `src/features/<feature>/`. Each feature folder follows this convention:

```
src/features/<feature>/
├── actions/       # Server actions (Next.js "use server")
├── components/    # React components scoped to this feature
├── config/        # Constants, enums, static config
├── hooks/         # Custom React hooks
├── lib/           # Pure utility/helper functions
├── types/         # TypeScript types and Zod schemas
└── index.ts       # (optional) barrel export
```

### Placement rules

| Kind                                     | Location                               |
| ---------------------------------------- | -------------------------------------- |
| Server action                            | `features/<feature>/actions/<name>.ts` |
| Component used by one feature            | `features/<feature>/components/`       |
| Shared UI primitives (Button, Dialog, …) | `src/components/ui/`                   |
| Shared composite components              | `src/components/shared/`               |
| Hook used by one feature                 | `features/<feature>/hooks/`            |
| Cross-feature hook                       | `src/hooks/common/`                    |
| Pure helper / computation                | `features/<feature>/lib/`              |
| Cross-feature utility                    | `src/lib/common/`                      |

### Barrel exports

Barrel `index.ts` files are optional. Use them when a folder has 4+ public exports consumed by other features. Example: `src/features/surveys/components/stats/answer-charts/index.ts`.
