---
trigger: always_on
---

# Skill: PPS Routing Guardian

## Description

Validates and optimizes routing implementation in Pain Point Studio using next-intl native routing. Ensures type-safe navigation, proper i18n integration, and centralized route management through ROUTES config.

## Triggers

Use this skill when:

- Adding new routes or pages
- Reviewing navigation components
- Fixing broken links
- Migrating from next/link to i18n routing
- Someone asks "how do I add a new route?"
- Debugging routing issues
- Setting up navigation menus

## Instructions

You are the routing auditor for Pain Point Studio. Ensure all navigation uses type-safe, i18n-compatible routing through centralized ROUTES config.

### Core Validation Checklist

**1. Import Sources**

- [ ] `Link` from `@/i18n/routing`, NOT `next/link`
- [ ] `redirect`, `usePathname`, `useRouter` from `@/i18n/routing`
- [ ] `ROUTES` imported from `@/config/routes`

**2. Route Configuration**

- [ ] New routes added to `src/i18n/pathnames.ts`
- [ ] New routes added to `src/config/routes.ts` with `AppRoute` type
- [ ] Translation labels in `src/i18n/messages/*.json` under `Common`

**3. Usage Patterns**

- [ ] Links use `ROUTES.group.name` (not raw strings)
- [ ] Labels use translation keys (e.g., `Common.features`)
- [ ] Hash links properly typed

### Response Format

**Status:** ✅ Compliant | ⚠️ Needs fixes | ❌ Wrong imports

**Issues Found:**

```
[Critical] Using next/link instead of @/i18n/routing
[Error] Raw string href instead of ROUTES
[Warning] Missing translation for label
```

**Suggested Fixes:** Specific changes with code examples

**Verification:**

- Type safety preserved ✓/✗
- i18n compatibility ✓/✗
- Navigation unchanged ✓/✗

### Common Issues & Fixes

**Issue 1: Wrong Link Import**

```tsx
// ❌ Bad: Direct next/link
import Link from 'next/link';
<Link href="/features">Features</Link>

// ✅ Good: i18n routing
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/config/routes';
<Link href={ROUTES.common.home}>Features</Link>
```

**Issue 2: Raw String Href**

```tsx
// ❌ Bad: Hardcoded path
<Link href="/pricing">Pricing</Link>

// ✅ Good: ROUTES config
<Link href={ROUTES.common.home}>Pricing</Link>
```

**Issue 3: Hardcoded Labels**

```tsx
// ❌ Bad: Hardcoded text
<Link href={ROUTES.common.home}>Features</Link>;

// ✅ Good: Translated label
const t = useTranslations();
<Link href={ROUTES.common.home}>{t('Common.features')}</Link>;
```

**Issue 4: Missing Route Config**

```typescript
// ❌ Bad: Route used but not configured
<Link href="/new-page">New Page</Link>

// ✅ Good: Add to pathnames.ts
export const PATHNAMES = {
  '/new-page': '/new-page',
} as const;

// And routes.ts
export const ROUTES = {
  marketing: {
    newPage: '/new-page' as AppRoute,
  },
};
```

### Adding New Route Workflow

**Step 1: Define pathname**

```typescript
// src/i18n/pathnames.ts
export const PATHNAMES = {
  '/': '/',
  '/features': '/features',
  '/pricing': '/pricing', // New route
} as const;
```

**Step 2: Add to ROUTES**

```typescript
// src/config/routes.ts
export const ROUTES = {
  marketing: {
    features: '/features' as AppRoute,
    pricing: '/pricing' as AppRoute, // New route
  },
} as const;
```

**Step 3: Add translation**

```json
// src/i18n/messages/en.json
{
  "Common": {
    "features": "Features",
    "pricing": "Pricing"
  }
}
```

**Step 4: Use in component**

```tsx
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/routing';

const t = useTranslations();
<Link href={ROUTES.common.home}>{t('Common.pricing')}</Link>;
```

### Navigation Patterns

**Standard navigation:**

```tsx
import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/routing';

<Link href={ROUTES.common.home}>Features</Link>;
```

**Hash links:**

```tsx
// Type casting for hash links
<Link href="/#features" as AppRoute>
  Jump to Features
</Link>
```

**External links:**

```tsx
// Use standard <a> for external
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  External
</a>
```

**Programmatic navigation:**

```tsx
import { useRouter } from '@/i18n/routing';

const router = useRouter();
router.push(ROUTES.common.home);
```

**Server redirects:**

```tsx
import { redirect } from '@/i18n/routing';

redirect(ROUTES.auth.signIn);
```

### Configuration Structure

**File organization:**

```
src/
├── i18n/
│   ├── pathnames.ts      # Abstract path → URL mapping
│   └── routing.ts        # next-intl routing config
├── config/
│   └── routes.ts         # Centralized ROUTES object
└── i18n/messages/
    └── en.json           # Route labels in Common section
```

**ROUTES object grouping:**

```typescript
export const ROUTES = {
  marketing: { ... },    // Public pages
  auth: { ... },         // Authentication
  dashboard: { ... },    // Authenticated area
} as const;
```

### Type Safety

**AppRoute type ensures valid paths:**

```typescript
// ✓ Valid: path in PATHNAMES
const validPath: AppRoute = '/features';

// ✗ Invalid: TypeScript error
const invalidPath: AppRoute = '/non-existent';
```

**Navigation config with types:**

```typescript
interface NavItem {
  label: string;
  href: AppRoute;
}

const navItems: NavItem[] = [
  { label: 'Common.features', href: ROUTES.common.home },
  { label: 'Common.pricing', href: ROUTES.common.home },
];
```

### Audit Commands

**Find wrong imports:**

```bash
grep -r "from 'next/link'" src/ --include="*.tsx"
# Should return no results
```

**Find raw string hrefs:**

```bash
grep -r 'href="/' src/ --include="*.tsx" | grep -v "ROUTES"
# Review results for non-hash, non-external links
```

**Verify ROUTES usage:**

```bash
grep -r "<Link href=" src/ --include="*.tsx"
# Should mostly see ROUTES.xxx.yyy
```

### Integration with PPS

- i18n-first: all routes automatically locale-prefixed
- Type safety: catch routing errors at compile time
- Centralization: single source of truth for paths
- Maintainability: easy refactoring and route changes

### Quick Reference

| Action   | Import                              | Usage                        |
| -------- | ----------------------------------- | ---------------------------- |
| Navigate | `Link` from `@/i18n/routing`        | `<Link href={ROUTES.x.y}>`   |
| Router   | `useRouter` from `@/i18n/routing`   | `router.push(ROUTES.x.y)`    |
| Redirect | `redirect` from `@/i18n/routing`    | `redirect(ROUTES.x.y)`       |
| Pathname | `usePathname` from `@/i18n/routing` | `const path = usePathname()` |

### Critical Rules

1. **Always use i18n routing** - never import from `next/link`
2. **ROUTES object required** - no raw string paths
3. **Translate labels** - all navigation text from i18n
4. **Complete config** - add routes to pathnames.ts AND routes.ts
5. **Type safety enforced** - AppRoute catches invalid paths

---

**Remember:** Type-safe routing prevents broken links and ensures proper i18n. Use ROUTES everywhere for maintainable navigation.
