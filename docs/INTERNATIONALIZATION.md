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
| `src/i18n/config.ts`          | Defines supported locales and default locale                         |
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

## Adding a New Language

1. **Add locale to config** - Update `locales` array in `src/i18n/config.ts`:

   ```ts
   locales: ['en', 'de'],
   ```

2. **Update proxy matcher** - Add the locale prefix in `src/proxy.ts`:

   ```ts
   matcher: ['/', '/(de|en)/:path*'],
   ```

3. **Create translation file** - Add `src/i18n/messages/de.json`.

4. **Update static params** - Add to `generateStaticParams()` in `src/app/[locale]/layout.tsx`:
   ```ts
   export function generateStaticParams() {
     return [{ locale: 'en' }, { locale: 'de' }];
   }
   ```

All translations are type-safe. Run `pnpm test:types` to verify your keys.
