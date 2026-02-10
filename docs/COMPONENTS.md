# Component & Page Architecture

This document defines the standards for building components and pages in **Pain Point Studio**. Every component must be designed for **maximum Lighthouse scores (100%)** across Performance, Accessibility, Best Practices, and SEO.

---

## 1. Core Principles

| Principle            | Description                                                                |
| -------------------- | -------------------------------------------------------------------------- |
| **Interface-First**  | Props are always defined as explicit `interface` above the component.      |
| **Typed Templates**  | Every prop, including array indices, must be typed. No implicit `any`.     |
| **Minimal Logic**    | Keep logic flat and readable. Avoid nested ternaries and complex branches. |
| **Accessible First** | Semantic HTML, proper ARIA attributes, keyboard navigability.              |
| **Performance Max**  | Optimize for CLS, LCP, FID. Lazy load, prefetch, and code-split correctly. |

---

## 2. Component Structure

Every component file follows this structure:

```tsx
// 1. Imports (external → internal → types → styles)
import { memo } from 'react';

import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/common/utils';

// 2. Interface (ALWAYS above the component, never inline)
interface ComponentNameProps {
  /** Brief description of prop purpose */
  title: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Optional: Additional class names */
  className?: string;
}

// 3. Component (named function, not anonymous arrow in export)
const ComponentName = ({ title, icon: Icon, className }: ComponentNameProps) => {
  return (
    <article className={cn('base-styles', className)}>
      <Icon className="size-6" aria-hidden="true" />
      <h2>{title}</h2>
    </article>
  );
};

// 4. Export (default or named, consistent per folder)
export default ComponentName;
```

### Why Interface Over Type?

- **Extensibility**: Interfaces can be extended (`extends`), useful for component variants.
- **Clarity**: Signals that this is a contract for a React component.
- **Convention**: Aligns with TypeScript team recommendations for object shapes.

---

## 3. Props Typing Rules

### 3.1 Always Use Explicit Types

```tsx
// ✅ Good: Explicit interface
interface CardProps {
  title: string;
  items: readonly Item[];
}

// ❌ Bad: Inline typing
const Card = ({ title, items }: { title: string; items: Item[] }) => { ... }
```

### 3.2 Array Iteration Must Type Index

```tsx
// ✅ Good: Index is explicitly typed
interface Item {
  id: string;
  label: string;
}

const List = ({ items }: { items: readonly Item[] }) => (
  <ul>
    {items.map((item: Item, index: number) => (
      <li key={item.id} data-index={index}>
        {item.label}
      </li>
    ))}
  </ul>
);

// ❌ Bad: Implicit types in map callback
{items.map((item, index) => ...)}
```

### 3.3 Children Props

Use `ReactNode` for children, never `ReactElement` unless you need to restrict to specific elements.

```tsx
interface ContainerProps {
  children: ReactNode;
}
```

### 3.4 Event Handlers

Type event handlers explicitly:

```tsx
interface ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
```

### 3.5 Optional vs Required

Mark optional props with `?`. Never use `| undefined` for optional props.

```tsx
interface Props {
  required: string;
  optional?: string; // ✅
  bad: string | undefined; // ❌ Use optional instead
}
```

---

## 4. Lighthouse Optimization Checklist

### 4.1 Performance (100%)

| Technique                    | Implementation                                                            |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Lazy Load Images**         | Use `next/image` with `loading="lazy"` for below-fold images              |
| **Avoid Layout Shift (CLS)** | Always set `width` and `height` on images                                 |
| **Code Splitting**           | Use `dynamic()` for heavy components not needed on first paint            |
| **Prefetch Links**           | `Link` from `next/link` auto-prefetches; use `prefetch={false}` sparingly |
| **Minimize JS**              | Avoid `'use client'` unless truly needed                                  |
| **Font Optimization**        | Use `next/font` with `display: swap`                                      |

```tsx
// ✅ Lazy-loaded component
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});
```

### 4.2 Accessibility (100%)

| Requirement            | Implementation                                                   |
| ---------------------- | ---------------------------------------------------------------- |
| **Semantic HTML**      | Use `<article>`, `<section>`, `<nav>`, `<main>` appropriately    |
| **Headings Hierarchy** | One `<h1>` per page, proper nesting (`h2` → `h3`)                |
| **Alt Text**           | All images have descriptive `alt` or `alt=""` for decorative     |
| **ARIA Labels**        | Interactive elements have `aria-label` or `aria-labelledby`      |
| **Focus Management**   | Visible focus states, logical tab order                          |
| **Color Contrast**     | Text meets WCAG AA (4.5:1 for normal, 3:1 for large)             |
| **Icon Accessibility** | Decorative icons: `aria-hidden="true"`. Functional: `aria-label` |

```tsx
// ✅ Accessible button with icon
<button aria-label="Close dialog" onClick={onClose}>
  <X className="size-5" aria-hidden="true" />
</button>

// ✅ Accessible decorative icon
<HeartIcon className="size-4" aria-hidden="true" />
```

### 4.3 Best Practices (100%)

| Requirement            | Implementation                                       |
| ---------------------- | ---------------------------------------------------- |
| **HTTPS**              | Enforced at deployment (Vercel handles this)         |
| **No Console Errors**  | Clean up all console logs/warnings before production |
| **Secure Links**       | External links: `rel="noopener noreferrer"`          |
| **No Deprecated APIs** | Avoid `componentWillMount`, etc.                     |

### 4.4 SEO (100%)

| Requirement          | Implementation                                                     |
| -------------------- | ------------------------------------------------------------------ |
| **Meta Tags**        | Title, description, og:\* via Next.js metadata                     |
| **Canonical URL**    | Set in metadata config                                             |
| **Structured Data**  | JSON-LD for articles, products, FAQ                                |
| **Sitemap**          | Auto-generated via `next-sitemap`                                  |
| **Robots.txt**       | Configured in `public/robots.txt`                                  |
| **Descriptive URLs** | Use slugs, not IDs (`/research/validate-idea` not `/research/123`) |

```tsx
// ✅ Page metadata (Next.js 14+)
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Dashboard | Pain Point Studio',
  description: 'Validate your product ideas with structured customer research.',
  openGraph: {
    title: 'Research Dashboard',
    description: 'Validate your product ideas...',
    type: 'website',
  },
};
```

---

## 5. Template Best Practices

### 5.1 Keep Templates Flat

```tsx
// ✅ Good: Flat, readable structure
const Card = ({ title, isActive }: CardProps) => {
  const statusClass = isActive ? 'bg-success' : 'bg-muted';

  return (
    <article className={cn('card', statusClass)}>
      <h3>{title}</h3>
    </article>
  );
};

// ❌ Bad: Complex inline logic
const Card = ({ title, isActive }: CardProps) => (
  <article className={`card ${isActive ? 'bg-success' : 'bg-muted'}`}>
    <h3>{title}</h3>
  </article>
);
```

### 5.2 Extract Repeated Logic

```tsx
// ✅ Good: Helper function for clarity
const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

const PriceTag = ({ amount }: { amount: number }) => (
  <span className="font-bold">{formatPrice(amount)}</span>
);

// ❌ Bad: Inline complex formatting
const PriceTag = ({ amount }: { amount: number }) => (
  <span className="font-bold">
    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}
  </span>
);
```

### 5.3 Avoid Method Calls in JSX

Pre-compute values before the return statement:

```tsx
// ✅ Good: Pre-computed
const NavItem = ({ item }: NavItemProps) => {
  const label = getLocalizedLabel(item.key);
  const isExternal = item.href.startsWith('http');

  return (
    <Link href={item.href} target={isExternal ? '_blank' : undefined}>
      {label}
    </Link>
  );
};

// ❌ Bad: Computed in template
const NavItem = ({ item }: NavItemProps) => (
  <Link
    href={item.href}
    target={item.href.startsWith('http') ? '_blank' : undefined}
  >
    {getLocalizedLabel(item.key)}
  </Link>
);
```

### 5.4 Conditional Rendering

```tsx
// ✅ Good: Early return for major conditions
const Alert = ({ message, type }: AlertProps) => {
  if (!message) return null;

  return (
    <div role="alert" className={cn('alert', `alert-${type}`)}>
      {message}
    </div>
  );
};

// ✅ Good: Ternary for simple branches
const Status = ({ isOnline }: { isOnline: boolean }) => (
  <span>{isOnline ? 'Online' : 'Offline'}</span>
);

// ❌ Bad: Nested ternaries
const Status = ({ status }: { status: 'online' | 'offline' | 'busy' }) => (
  <span>
    {status === 'online' ? 'Online' : status === 'busy' ? 'Busy' : 'Offline'}
  </span>
);

// ✅ Good: Object map for multiple conditions
const STATUS_LABELS: Record<Status, string> = {
  online: 'Online',
  busy: 'Busy',
  offline: 'Offline',
};

const Status = ({ status }: { status: Status }) => (
  <span>{STATUS_LABELS[status]}</span>
);
```

---

## 6. Shared Component Patterns

The project provides reusable components to eliminate repeated patterns. Always use these instead of re-implementing the same logic.

### SubmitButton

Combines `Button` + `Spinner` for form submission. Replaces the repeated pattern of disabling a button and showing a spinner during loading.

```tsx
import { SubmitButton } from '@/components/ui/submit-button';

<SubmitButton isLoading={isLoading}>{t('save')}</SubmitButton>;
```

### PasswordInput (with default i18n)

Has built-in `useTranslations('auth')` for placeholder and toggle labels. No need to pass `showPasswordLabel`, `hidePasswordLabel`, or `placeholder` — they default to auth translations.

```tsx
import { PasswordInput } from '@/components/ui/password-input';

<PasswordInput {...field} />;
```

### AuthSuccessMessage

Reusable success state for auth flows (sign-up confirmation, forgot-password). Renders a "check your email" message with a back-to-sign-in link.

```tsx
import { AuthSuccessMessage } from '@/features/auth/components/common/auth-success-message';

<AuthSuccessMessage messageKey="auth.signUpSuccess" />;
```

### SettingsSectionHeader (with action slot)

Section header with optional `action` slot for placing buttons alongside the title/description.

```tsx
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';

<SettingsSectionHeader
  title={t('title')}
  description={t('description')}
  action={<Button size="sm">{t('edit')}</Button>}
/>;
```

### SidebarNavList

Encapsulates the sidebar navigation items with separators. Used by both desktop sidebar and mobile nav.

```tsx
import { SidebarNavList } from '@/features/dashboard/components/layout/sidebar-nav-list';

<SidebarNavList isExpanded={isExpanded} />;
```

---

## 7. Component File Checklist

Before considering a component complete, verify:

- [ ] Props defined as `interface` above component
- [ ] All array iterations have typed index: `(item: T, index: number)`
- [ ] No implicit `any` anywhere (TypeScript strict mode catches this)
- [ ] Images have `width`, `height`, and meaningful `alt`
- [ ] Interactive elements are keyboard accessible
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Functional icons have `aria-label`
- [ ] No inline method calls in JSX (pre-compute)
- [ ] `'use client'` only when necessary
- [ ] External links have `rel="noopener noreferrer"`
- [ ] Semantic HTML tags used correctly

---

## 8. Example: Optimized Component

```tsx
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/common/utils';

// Props interface with documentation
interface FeatureCardProps {
  /** Feature title displayed as heading */
  title: string;
  /** Brief description of the feature */
  description: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Optional: Additional CSS classes */
  className?: string;
}

const FeatureCard = ({ title, description, icon: Icon, className }: FeatureCardProps) => {
  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-lg border p-6',
        'bg-card text-card-foreground',
        'transition-shadow hover:shadow-lg',
        className
      )}
    >
      <div
        className="bg-primary flex size-10 items-center justify-center rounded-md"
        aria-hidden="true"
      >
        <Icon className="text-primary-foreground size-5" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>

      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </article>
  );
};

export default FeatureCard;
```

---

## 9. Page Component Standards

Pages have additional requirements beyond regular components:

```tsx
import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import Features from '@/components/marketing/sections/features';
import Hero from '@/components/marketing/sections/hero';

// Metadata for SEO (100% score)
export const metadata: Metadata = {
  title: 'Page Title | Pain Point Studio',
  description: 'Compelling description under 160 characters for search results.',
  openGraph: {
    title: 'Page Title',
    description: 'Same or similar description for social sharing.',
    type: 'website',
  },
};

// Server Component by default (Performance: no 'use client')
export default async function PageName() {
  const t = await getTranslations('PageName');

  return (
    <main>
      <h1 className="sr-only">{t('pageTitle')}</h1>
      <Hero />
      <Features />
    </main>
  );
}
```

### Page Checklist

- [ ] `Metadata` export with title, description, openGraph
- [ ] Single `<h1>` (can be visually hidden with `sr-only`)
- [ ] `<main>` wrapper for primary content
- [ ] Sections use appropriate semantic tags
- [ ] Server Component unless client interactivity required

---

## 10. Anti-Patterns to Avoid

| Anti-Pattern               | Why It's Bad                                | Correct Approach                              |
| -------------------------- | ------------------------------------------- | --------------------------------------------- |
| Inline prop types          | Hard to read, not reusable                  | Use `interface` above component               |
| Untyped map callbacks      | Breaks type safety, hides bugs              | Type `(item: T, index: number)`               |
| `any` type                 | Defeats TypeScript's purpose                | Define proper types                           |
| Missing `alt` on images    | Accessibility failure, SEO penalty          | Always provide meaningful `alt`               |
| Icon without `aria-hidden` | Screen readers read meaningless content     | Add `aria-hidden="true"`                      |
| Inline complex logic       | Hard to test, hard to read                  | Extract to variables/functions                |
| `'use client'` by default  | Increases bundle, breaks streaming          | Only when truly interactive                   |
| Missing `key` in lists     | React reconciliation issues                 | Use unique, stable keys                       |
| Hardcoded strings          | Breaks i18n, hard to maintain               | Use translation functions                     |
| **Comments in components** | Adds noise, code should be self-documenting | Remove all comments from component/page files |

---

This guide ensures every component in Pain Point Studio meets the highest standards for type safety, performance, accessibility, and maintainability.

---

## 11. AI Optimization Instructions

> **For AI assistants optimizing files according to this document:**
>
> I will provide you with files, and you will optimize them according to these instructions, ensuring that their appearance and functionality remain unchanged from the user's perspective.
>
> **Key rules:**
>
> 1. Extract inline props to `interface` above component
> 2. Type all `.map()` callbacks: `(item: T, index: number)`
> 3. Pre-compute values before `return` (no method calls in JSX)
> 4. Add `aria-hidden="true"` to decorative icons
> 5. **Remove ALL comments** from component/page files (code should be self-documenting)
> 6. Keep JSDoc on interface props only (for IDE hints)
> 7. Verify TypeScript compiles without errors after changes
> 8. Visual appearance and functionality must remain **identical**
