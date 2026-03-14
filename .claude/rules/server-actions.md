---
description: Server action patterns — wrappers, caching, error handling, data fetching
paths:
  - 'src/features/*/actions/**'
  - 'src/lib/common/with-protected-action.ts'
  - 'src/lib/common/with-public-action.ts'
---

# Server Action Rules

## Write Actions (mutations)

Always use HOF wrappers — never raw `'use server'` functions:

```ts
export const myAction = withProtectedAction('action-key', {
  schema: mySchema,
  rateLimit: RATE_LIMITS.preset,
  action: async ({ data, user, supabase }) => {
    // business logic only — wrapper handles auth, validation, rate-limit, errors
  },
});
```

- Return `ActionResult<T>` — never throw from inside `action`
- Error strings must be i18n keys: `'feature.errors.specificError'`
- Map Supabase errors via `mapSupabaseError()` from `@/lib/supabase/errors`
- Do NOT add try-catch inside `action` unless you need to handle a specific error for branching logic — the wrapper catches everything else

## Read Actions (data fetching)

- Always wrap with React `cache()` for per-request deduplication:
  ```ts
  export const getMyData = cache(async () => { ... })
  ```
- Return `Data | null` — never throw, return null on error
- Use `createServerClient()` from `@/lib/supabase/server`

## Client-side consumption

- Forms: always use `useFormAction()` hook — never `useTransition()` directly for form submissions
- `useFormAction()` handles: loading state, toast notifications, error mapping, auth redirects
- Non-form async operations (e.g., delete button): `useTransition()` is acceptable
- After mutations: `router.refresh()` to invalidate server component data
