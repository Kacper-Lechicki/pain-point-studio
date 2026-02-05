# Internationalization (i18n)

This project uses `next-intl` for internationalization with locale-prefixed routing.

## Architecture

```text
src/
├── app/
│   ├── [locale]/                 # Dynamic locale segment (required for i18n routing)
│   │   ├── layout.tsx            # Locale layout - sets requestLocale
│   │   └── (marketing)/          # Route groups live inside [locale]
│   │       └── page.tsx
│   └── layout.tsx                # Root layout - wraps NextIntlClientProvider
├── i18n/
│   ├── config.ts                 # Middleware config (locales, defaultLocale)
│   ├── request.ts                # Server-side locale resolution
│   └── messages/
│       └── en.json               # Translation files
└── proxy.ts                      # Next.js 16 proxy (replaces middleware.ts)
```

## Key Files

| File                          | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `src/proxy.ts`                | Entry point for i18n routing (Next.js 16 uses proxy, not middleware) |
| `src/i18n/constants.ts`       | Single source of truth for supported `locales`                       |
| `src/i18n/config.ts`          | Middleware config (pathnames, defaultLocale)                         |
| `src/i18n/request.ts`         | Resolves locale from routing and loads messages                      |
| `src/app/[locale]/layout.tsx` | Sets the request locale for static rendering                         |
| `src/app/layout.tsx`          | Wraps app in `NextIntlClientProvider`                                |

## Usage

### Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

### Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function Counter() {
  const t = useTranslations('HomePage');
  return <p>{t('description')}</p>;
}
```

## Routing

All requests are routed through the `[locale]` dynamic segment:

- `/` → redirects to `/en` (default locale)
- `/en` → English version
- `/de` → German version (when added)

The proxy in `src/proxy.ts` handles the redirect logic.

## Adding a New Locale

Follow this simplified checklist to add a new language (e.g., `de` for German). The system is designed to auto-configure routing and static generation based on `src/i18n/constants.ts`.

### Step 1: Update Constants

**File:** `src/i18n/constants.ts`

Approve the new locale in the central configuration:

```ts
export const locales = ['en', 'de'] as const;
```

> **Note:** This automatically updates:
>
> - `src/proxy.ts` matchers
> - `src/i18n/config.ts` middleware validation
> - `src/app/[locale]/layout.tsx` static params generation

### Step 2: Create Translation File

**File:** `src/i18n/messages/de.json`

Copy the structure from `en.json` and translate all values:

```json
{
  "HomePage": {
    "title": "Willkommen",
    "description": "Ihre Produktideen validieren"
  },
  "Common": {
    "features": "Funktionen",
    "pricing": "Preise"
  }
}
```

> **Important:** Keys must be identical across all locale files. Only values differ.

### Step 3: Localize Pathnames (Optional)

**File:** `src/i18n/pathnames.ts`

If you want localized URLs (e.g., `/de/preise` instead of `/de/pricing`), add translations to `PATHNAMES`:

```ts
export const PATHNAMES = {
  // ...
  '/pricing': {
    en: '/pricing',
    de: '/preise',
  },
} as const;
```

### Step 4: Verify Type Safety

Run TypeScript to ensure all translation keys are valid:

```bash
pnpm test:types
```

### Checklist Summary

| Step | File                              | Action                        |
| ---- | --------------------------------- | ----------------------------- |
| 1    | `src/i18n/constants.ts`           | Add locale to `locales` array |
| 2    | `src/i18n/messages/{locale}.json` | Create translation file       |
| 3    | `src/i18n/pathnames.ts`           | (Optional) Localize URL paths |
| 4    | Terminal                          | Run `pnpm test:types`         |

All translations are type-safe. Missing keys will cause TypeScript errors.

---

## AI Optimization Instructions

> **For AI assistants auditing files according to this document:**
>
> I will provide you with i18n-related files (translation JSONs, components using translations), and you will verify and optimize them according to these instructions, ensuring that their behavior remains unchanged.
>
> **Key rules:**
>
> 1. Verify all translation keys exist in JSON files before use
> 2. Check that `getTranslations` (server) and `useTranslations` (client) are used correctly
> 3. Ensure new locales are added to all required files (config, proxy, static params)
> 4. Validate translation file structure consistency across locales
> 5. Confirm `[locale]` dynamic segment is properly configured
> 6. **Do not change translation content** - only fix structural issues
> 7. Functionality must remain **identical**
