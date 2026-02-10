# Pain Point Studio

Pain Point Studio is a research platform designed for developer validation workflows. It solves one of the most common issues in software development: the lack of validation before building. 70% of side projects are abandoned because they didn't solve a real problem. PPS enables a structured research process from idea to first feedback in hours instead of weeks.

&nbsp;

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [pnpm](https://pnpm.io/) (v10 or later)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for local Supabase)

### Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.local.example .env.local
   ```

3. **Start development environment**:

   This command starts the local Supabase stack, Supabase Studio, and the Next.js dev server concurrently:

   ```bash
   pnpm run:dev
   ```

   > **Note**: Make sure Docker is running before executing this command.

   Access the application:
   - **App**: [http://localhost:3000](http://localhost:3000)
   - **Supabase Studio**: [http://localhost:54323](http://localhost:54323)

&nbsp;

## 📂 Project Resources

This repository is designed with **velocity and discipline** in mind. Detailed documentation and architectural rules can be found in the following directories:

### `docs/` - Technical Documentation

This folder contains the "Source of Truth" for the project's technical standards:

- **[PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)**: Feature-First architecture and directory organization.
- **[SUPABASE.md](./docs/SUPABASE.md)**: Database schema, migrations, and local development workflows.
- **[COMPONENTS.md](./docs/COMPONENTS.md)**: Standards for 100% Lighthouse scores and accessibility.
- **[TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)**: High-ROI testing approach (Unit vs E2E).
- **[INTERNATIONALIZATION.md](./docs/INTERNATIONALIZATION.md)**: multi-language routing and pathname management.
- **[ROUTING.md](./docs/ROUTING.md)**: Type-safe navigation and route configuration.
- **[ENV_VARIABLES.md](./docs/ENV_VARIABLES.md)**: Type-safe environment variable handling.
- **[CI_CD.md](./docs/CI_CD.md)**: GitHub Actions workflows and branching strategy.
- **[GIT_USAGE.md](./docs/GIT_USAGE.md)**: Branching strategy and commit conventions.
- **[PNPM_USAGE.md](./docs/PNPM_USAGE.md)**: Dependency management and script standards.

### `.cursor/rules/` - AI Guardian Rules

Specialized Cursor AI rules that audit code in real-time to ensure it meets architectural standards:

- **pps-architect** — Senior architect decision framework and technical debt policy.
- **pps-component-quality-guardian** — 100% Lighthouse compliance, TypeScript type safety, shared component reuse.
- **pps-supabase-guardian** — Client selection, RLS enforcement, migration hygiene, `(select auth.uid())` pattern.
- **pps-testing-guardian** — ROI framework, `withProtectedAction` test patterns, E2E structural selectors.
- **pps-project-structure-guardian** — Feature-First architecture, naming conventions, colocation rules.
- **pps-i18n-guardian** — Translation consistency, locale routing, namespace conventions.
- **pps-routing-guradian** — Type-safe routes, sibling navigation, import sources.
- **pps-env-guardian** — Zod-validated env vars, server/client separation.
- **pps-ci-cd-guardian** — Branch naming, pipeline isolation, workflow triggers.

&nbsp;

---

Built with precision by **Pain Point Studio**.
