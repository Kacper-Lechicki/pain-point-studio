# Routing

This project uses `next-intl`'s native routing mechanism for internationalization. This provides a type-safe, standard way to handle localized paths without custom boilerplate.

## Configuration

The core routing logic is defined in `src/i18n/routing.ts`, while path mappings are kept in `src/i18n/pathnames.ts`.

```typescript
// src/i18n/pathnames.ts
export const PATHNAMES = {
  '/': '/',
  '/sign-in': '/sign-in',
  '/dashboard': '/dashboard',
} as const;
```

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames: PATHNAMES,
});
```

## Usage

### 1. Navigation (`<Link>`)

Use the `Link` component exported from `@/i18n/routing`. It is a wrapped version of `next-intl`'s Link that supports:

1.  **Typed Abstract Paths**: The keys defined in `PATHNAMES`.
2.  **Raw Strings**: Useful for hash links (e.g., `/#features`) or external URLs.

```tsx
import { Link } from '@/i18n/routing';

// Standard localized route
<Link href="/dashboard">Dashboard</Link>;

// Hash link (supported via custom type casting)
<Link href="/#features">Features</Link>;
```

### 2. Redirects & Pathname

Use the exported helpers `redirect`, `usePathname`, `useRouter`, and `getPathname` from `@/i18n/routing`. These utilities automatically handle locale prefixes.

```tsx
import { redirect } from '@/i18n/routing';

redirect('/dashboard');
```

## Adding New Routes

1.  Open `src/i18n/pathnames.ts`.
2.  Add a new entry to the `PATHNAMES` object.
    - For same path across locales: `'/my-path': '/my-path'`
    - For localized paths: `'/my-path': { en: '/my-path', pl: '/moja-sciezka' }`

This approach ensures strict type safety. If you use an abstract path that isn't in `PATHNAMES`, TypeScript will validate it against the allowed patterns. For hash links or special cases, the component allows standard strings.
