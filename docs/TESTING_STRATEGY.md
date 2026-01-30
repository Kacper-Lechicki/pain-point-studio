# Testing Strategy & Standards

This document defines the testing philosophy for **Pain Point Studio**. Our goal is **High Confidence, Low Friction**. We invest in tests that prevent critical regressions without slowing down feature development.

## 1. The Strategy (The Pyramid)

We follow a pragmatic testing pyramid:

1.  **E2E Tests (Playwright)**: Checks Critical User Journeys (CUJs). Few, slow, but highly valuable. They simulate a real user.
2.  **Unit/Integration Tests (Vitest)**: Checks business logic, validations, and distinct modules. Fast, focused, and cover edge cases.
3.  **Static Analysis (TypeScript/ESLint)**: The first line of defense.

---

## 2. What to Test (ROI Framework)

Not everything deserves a test. Use this guide to decide.

### ✅ MUST Test (High ROI)

- **Critical Flows (E2E)**:
  - Authentication (Login/Register).
  - Core Business Value: Creating a Research Mission.
  - Public facing: Respondent filling out a survey.
  - _Rule: If this breaks, do we lose money/users? If yes, E2E it._
- **Complex Logic (Unit)**:
  - Pricing/Billing calculations.
  - Data transformation/parsing algorithms.
  - Complex regex or string manipulation.
- **Safety/Permissions (Integration)**:
  - Server Actions: Ensure a user cannot delete another user's data.
  - Zod Schemas: Verify strict validation rules.

### ❌ DO NOT Test (Low ROI)

- **Visuals**: Don't test that a button is correctly aligned or blue. (Unless using Visual Regression for Design System).
- **Libraries**: Don't test that `react-hook-form` works. Assume dependencies work.
- **Trivial Code**: Simple UI components that just render props.
- **implementation Details**: Don't test private methods. Test the public API.

---

## 3. How to Write Tests

### E2E Tests (Playwright)

- **Location**: `e2e/`
- **Pattern**: User-centric.
- **Selectors**: Use clear accessibility roles first (`getByRole('button', { name: 'Save' })`). Use `data-testid` only as a last resort.
- **Data**: Each test should be independent. Ideally, create fresh data (e.g., a new user) for each test run to avoid brittleness.
- **Mocks**: **Avoid mocking the backend**. E2E should test the real stack (Database -> API -> Client).

```typescript
test('Visitor can register and create a workspace', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Email').fill('new@user.com');
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

### Unit Tests (Vitest)

- **Location**: **Colocated** (`component.test.ts` next to `component.ts`).
  - _Why?_ High visibility. If you change the file, the test is right there.
- **Pattern**: Input -> Output.
- **Mocks**: Mock external boundaries (Database, Third-party APIs) to keep tests fast (sub-millisecond).

```typescript
test('calculateTotal should apply discount correctly', () => {
  const cart = [{ price: 100 }, { price: 50 }];
  expect(calculateTotal(cart, 0.1)).toBe(135);
});
```

---

## 4. Commands

| Command         | Description                         |
| :-------------- | :---------------------------------- |
| `pnpm test`     | Run Unit/Integration tests (Vitest) |
| `pnpm test:e2e` | Run End-to-End tests (Playwright)   |

---

## 5. CI/CD Integration

- **Pull Requests**: Run Unit Tests inside CI. Must pass to merge.
- **Merge to Main**: Run E2E Tests. Ensures Production is always deployable.

---

## 6. Environment Setup

### Playwright Configuration

The `playwright.config.ts` requires proper environment variable loading. Key points:

1. **Load before validation**: Environment variables must be loaded _before_ importing `env.ts` (which validates on import).
2. **WebServer timeout**: Set to 120s to handle Next.js cold starts.
3. **Environment file**: Uses `@next/env` to load `.env` files.

```typescript
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { env } = require('./src/lib/env');
```

### Required Environment Variables

For E2E tests to run, ensure `.env` contains:

```env
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

See `docs/ENV_VARIABLES.md` for the complete list.
