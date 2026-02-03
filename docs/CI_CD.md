# CI/CD & Branching Guidelines

This project uses **GitHub Actions** to automate quality checks and deployments (future). This document outlines the branching strategy, automated checks, and how to trigger testing.

## 🌿 Branching Strategy

We follow a strict naming convention to keep our history clean and organized.

### Allowed Prefixes

Your branch **MUST** start with one of the following prefixes:

- `feat/...` - New features
- `fix/...` - Bug fixes
- `docs/...` - Documentation updates
- `setup/...` - Configuration changes
- `test/...` - Adding or fixing tests
- `release/...` - Release preparation

**Example:** `feat/user-authentication` or `fix/login-bug`.

> [!IMPORTANT]
> The CI pipeline will **fail** any Pull Request that does not follow this naming convention.

---

## 🤖 CI Pipelines (GitHub Actions)

### 1. Main CI (`ci.yml`)

Runs automatically on:

- Push to `main` or `release/*`
- Pull Request to `main` or `release/*`

**Checks performed:**

1.  **Branch Name Validation**: Ensures compliance with the strategy above.
2.  **Type Check**: `pnpm test:types` (TypeScript validation).
3.  **Linting**: `pnpm lint` (ESLint) & `pnpm lint:prettier` (Prettier).
4.  **Unit Tests**: `pnpm test:unit` (Vitest).

### 2. E2E Tests (`e2e.yml`)

End-to-End tests (Playwright) are **expensive** and **slow**, so they do NOT run on every commit.

**Triggers:**

- **Manual**: Go to `Actions` tab -> `E2E Tests` -> `Run workflow`.
- **Label**: Add the label `run-e2e` to your Pull Request.

> [!TIP]
> **Requirement**: Before merging to `main`, you must successfully run the E2E tests at least once for your final changes.

---

## 🚀 How to Merge

1.  Open a Pull Request.
2.  Wait for **Main CI** to pass (Lint, Types, Unit).
3.  If ready, add the `run-e2e` label (or trigger manually) to run full system tests.
4.  Once all checks turn green, merge!

---

## AI Optimization Instructions

> **For AI assistants auditing files according to this document:**
>
> I will provide you with CI/CD configuration files (GitHub Actions workflows, scripts), and you will verify and optimize them according to these instructions, ensuring that their behavior remains unchanged.
>
> **Key rules:**
>
> 1. Verify branch naming patterns match the allowed prefixes
> 2. Ensure all required CI steps are present (types, lint, unit tests)
> 3. Check workflow triggers are correctly configured
> 4. Validate environment variable handling in CI context
> 5. Confirm E2E tests are properly isolated (manual/label trigger)
> 6. **Do not change workflow behavior** - only fix misconfigurations
> 7. Functionality must remain **identical**
