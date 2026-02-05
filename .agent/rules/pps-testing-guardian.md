---
trigger: always_on
---

# Skill: PPS Testing Guardian

## Description

Validates and optimizes testing implementation in Pain Point Studio following the "High Confidence, Low Friction" philosophy. Ensures tests focus on critical flows with high ROI, use proper selectors, and maintain independence.

## Triggers

Use this skill when:

- Writing new tests (E2E or unit)
- Reviewing test files
- Debugging failing tests
- Setting up test infrastructure
- Someone asks "should I test this?"
- Optimizing test suite performance
- Fixing flaky tests

## Instructions

You are the testing auditor for Pain Point Studio. Ensure tests provide high confidence without slowing development, following the pragmatic testing pyramid.

### Core Validation Checklist

**1. Test ROI (What to Test)**

- [ ] Critical user journeys covered by E2E
- [ ] Complex business logic covered by unit tests
- [ ] Security/permissions validated
- [ ] No tests for trivial UI rendering
- [ ] No tests for library functionality
- [ ] No tests for implementation details

**2. E2E Tests (Playwright)**

- [ ] Located in `e2e/` directory
- [ ] Use accessibility selectors (`getByRole`, `getByLabel`)
- [ ] Avoid `data-testid` unless necessary
- [ ] Independent test data (no shared state)
- [ ] Test real stack (no backend mocks)
- [ ] User-centric scenarios

**3. Unit Tests (Vitest)**

- [ ] Colocated with source files (`component.test.ts`)
- [ ] Input → Output pattern
- [ ] Mock only external boundaries (DB, APIs)
- [ ] Fast execution (sub-millisecond)
- [ ] Clear, focused assertions

**4. Environment & CI**

- [ ] `.env` loaded before validation
- [ ] Required env vars present
- [ ] Unit tests run on PRs
- [ ] E2E tests run on merge to main

### Response Format

**Status:** ✅ Well-tested | ⚠️ Needs improvement | ❌ Wrong approach

**Issues Found:**

```
[Critical] Testing trivial component
[Error] Using data-testid instead of accessibility selector
[Warning] Shared state between tests
[Info] Could mock external API for speed
```

**Suggested Fixes:** Specific changes with examples

**Verification:**

- Test coverage maintained ✓/✗
- Performance acceptable ✓/✗
- Assertions unchanged ✓/✗

### Testing Pyramid

```
      E2E (Playwright)
     Few, Slow, Critical
    ───────────────────
   Unit/Integration (Vitest)
  Fast, Focused, Edge Cases
 ─────────────────────────────
Static Analysis (TypeScript/ESLint)
        First Defense
```

### ROI Framework: What to Test

**✅ MUST Test (High ROI):**

**Critical Flows (E2E):**

- Authentication (Login/Register)
- Creating Research Mission
- Respondent filling survey
- _Rule: If breaks → lose money/users? → E2E it_

**Complex Logic (Unit):**

- Pricing/billing calculations
- Data transformation algorithms
- Complex regex/string manipulation

**Safety/Permissions (Integration):**

- Server actions: user cannot delete others' data
- Zod schemas: strict validation rules

**❌ DO NOT Test (Low ROI):**

- Visual alignment/colors
- Library functionality (react-hook-form, etc.)
- Trivial UI components (just render props)
- Implementation details (private methods)

### Common Issues & Fixes

**Issue 1: Wrong Selectors**

```typescript
// ❌ Bad: data-testid overuse
await page.locator('[data-testid="submit-button"]').click();

// ✅ Good: Accessibility selector
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('user@example.com');
```

**Issue 2: Testing Trivial Code**

```typescript
// ❌ Bad: Testing simple render
test('Button renders children', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

// ✅ Good: Test behavior, not rendering
test('Button calls onClick when clicked', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalled();
});
```

**Issue 3: Shared Test State**

```typescript
// ❌ Bad: Shared state between tests
let user;
beforeAll(async () => {
  user = await createUser(); // Reused across tests
});

test('test 1', () => {
  /* uses user */
});
test('test 2', () => {
  /* modifies user */
});

// ✅ Good: Independent data
test('test 1', async () => {
  const user = await createUser(); // Fresh data
  // ...
});
```

**Issue 4: Over-mocking in E2E**

```typescript
// ❌ Bad: Mocking backend in E2E
test('create research', async ({ page }) => {
  await page.route('/api/research', (route) => {
    route.fulfill({ body: '{"id": 1}' }); // Mocked
  });
});

// ✅ Good: Test real stack
test('create research', async ({ page }) => {
  await page.goto('/research/new');
  await page.getByLabel('Title').fill('Test Research');
  await page.getByRole('button', { name: 'Create' }).click();
  // Real API call to real DB
});
```

**Issue 5: Testing Implementation**

```typescript
// ❌ Bad: Testing private method
test('_calculateDiscount works', () => {
  expect(service._calculateDiscount(100)).toBe(90);
});

// ✅ Good: Test public API
test('getTotalWithDiscount applies 10% discount', () => {
  expect(service.getTotalWithDiscount(100)).toBe(90);
});
```

**Issue 6: Wrong Test Location**

```
❌ Bad: Centralized tests
tests/
  unit/
    components/
      button.test.ts

✅ Good: Colocated
src/
  components/
    button.tsx
    button.test.ts
```

### E2E Test Pattern

**Good E2E test structure:**

```typescript
import { expect, test } from '@playwright/test';

test('User can register and create workspace', async ({ page }) => {
  // Arrange: Navigate
  await page.goto('/register');

  // Act: Fill form
  await page.getByLabel('Email').fill('new@user.com');
  await page.getByLabel('Password').fill('SecurePass123!');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  // Assert: Verify outcome
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

**Accessibility selector priority:**

1. `getByRole` - Best (semantic, accessible)
2. `getByLabel` - Good (forms)
3. `getByText` - OK (unique text)
4. `getByTestId` - Last resort (stable but not semantic)

### Unit Test Pattern

**Good unit test structure:**

```typescript
import { describe, expect, test, vi } from 'vitest';

import { calculateTotal } from './pricing';

describe('calculateTotal', () => {
  test('applies discount correctly', () => {
    const cart = [{ price: 100 }, { price: 50 }];
    expect(calculateTotal(cart, 0.1)).toBe(135);
  });

  test('handles empty cart', () => {
    expect(calculateTotal([], 0.1)).toBe(0);
  });

  test('validates discount range', () => {
    expect(() => calculateTotal([{ price: 100 }], 1.5)).toThrow('Invalid discount');
  });
});
```

**Mock external boundaries only:**

```typescript
// Mock database
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: mockData })),
    })),
  })),
}));

// Don't mock: React hooks, utility functions, business logic
```

### Environment Setup

**Playwright config pattern:**

```typescript
// Load env BEFORE importing env.ts
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { env } = require('./src/lib/env');

export default defineConfig({
  webServer: {
    command: 'pnpm dev',
    url: env.NEXT_PUBLIC_APP_URL,
    timeout: 120000, // 120s for Next.js cold start
  },
});
```

**Required env vars for E2E:**

```env
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# + all other required vars from env.ts
```

### Commands Reference

| Command           | Purpose                   | When                 |
| ----------------- | ------------------------- | -------------------- |
| `pnpm test`       | Unit/Integration (Vitest) | Development, CI (PR) |
| `pnpm test:e2e`   | E2E (Playwright)          | Pre-merge, CI (main) |
| `pnpm test:types` | TypeScript validation     | Always               |

### CI/CD Integration

**PR workflow:**

- Run unit tests (fast feedback)
- Run type checking
- Run linting

**Merge to main:**

- Run full E2E suite
- Ensures production deployability

### Audit Workflow

**Check test location:**

```bash
# Find non-colocated unit tests
find tests/ -name "*.test.ts" 2>/dev/null
# Should be minimal/empty
```

**Find data-testid overuse:**

```bash
grep -r "data-testid" e2e/ --include="*.ts"
# Review for accessibility alternatives
```

**Check for trivial tests:**

```bash
# Look for simple render tests
grep -r "toBeInTheDocument" src/ --include="*.test.ts*"
# Verify they test behavior, not just rendering
```

### Integration with PPS

- High confidence: E2E covers critical revenue flows
- Low friction: Fast unit tests enable rapid iteration
- ROI-focused: Test what matters, skip trivia
- Type safety: TypeScript catches most bugs before tests

### Quick Decision Guide

**Should I write a test?**

```
Does it involve money/auth/data loss?
├─ YES → E2E test
│
Is it complex logic (>10 lines)?
├─ YES → Unit test
│
Is it a simple UI component?
└─ NO → Skip, TypeScript is enough
```

### Critical Rules

1. **ROI first** - test critical flows, not everything
2. **E2E uses real stack** - no backend mocking
3. **Accessibility selectors** - getByRole/Label over data-testid
4. **Colocate unit tests** - next to source files
5. **Independent data** - no shared state between tests

---

**Remember:** Good tests prevent regressions without slowing development. Focus on critical paths and complex logic. TypeScript + ESLint catch the rest.
