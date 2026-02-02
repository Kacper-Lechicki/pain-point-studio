# Routing

This project uses `next-intl`'s native routing mechanism for internationalization. This provides a type-safe, standard way to handle localized paths without custom boilerplate.

## Configuration

The core routing logic is defined in `src/i18n/routing.ts`, while path mappings are kept in `src/i18n/pathnames.ts`. Additionally, we use a centralized `ROUTES` object for cleaner imports and type safety across the app.

### 1. Pathnames (`src/i18n/pathnames.ts`)

Defines the abstract path to actual URL mapping (including localized versions).

```typescript
export const PATHNAMES = {
  '/': '/',
  '/features': '/features',
  '/sign-in': '/sign-in',
} as const;
```

### 2. Centralized Routes (`src/config/routes.ts`)

Provides a typed object for easy access to application routes and defines the `AppRoute` type.

```typescript
export const ROUTES = {
  marketing: {
    features: '/features' as AppRoute,
  },
  auth: {
    signIn: '/sign-in' as AppRoute,
  },
} as const;
```

## Usage

### 1. Navigation (`<Link>`)

Use the `Link` component exported from `@/i18n/routing`. It supports:

1.  **Typed Abstract Paths**: The keys defined in `PATHNAMES`.
2.  **ROUTES object**: Recommended for maintenance.
3.  **Raw Strings**: For hash links (e.g., `/#features`) or external URLs.

```tsx
import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/routing';

// Using ROUTES (Recommended)
<Link href={ROUTES.marketing.features}>Features</Link>;

// Standard localized route
<Link href="/dashboard">Dashboard</Link>;

// Hash link (supported via custom type casting)
<Link href="/#features">Features</Link>;
```

### 2. Localized Labels

Labels for navigation and footer items should be stored in the `Common` section of translation files (e.g., `src/i18n/messages/en.json`).

```json
{
  "Common": {
    "features": "Features",
    "pricing": "Pricing"
  }
}
```

In config files:

```tsx
{ label: 'Common.features', href: ROUTES.marketing.features }
```

In components:

```tsx
const t = useTranslations();
<Link href={item.href}>{t(item.label)}</Link>;
```

### 3. Redirects & Pathname

Use the exported helpers `redirect`, `usePathname`, `useRouter`, and `getPathname` from `@/i18n/routing`. These utilities automatically handle locale prefixes.

```tsx
import { redirect } from '@/i18n/routing';

redirect('/dashboard');
```

## Adding New Routes

To add a new route, follow these steps:

1.  **Define Pathname**: Add the route to `src/i18n/pathnames.ts`.
2.  **Add to Centralized Config**: Add the route to `src/config/routes.ts` with appropriate type casting to `AppRoute`.
3.  **Add Translation**: Add the localized label to the `Common` section in `src/i18n/messages/*.json`.
4.  **Usage**: Use `ROUTES.group.name` and translate the label in your components.

This approach ensures strict type safety. If you use an abstract path that isn't in `PATHNAMES`, TypeScript will validate it.
