# Pain Point Studio 🚀

Pain Point Studio is a research platform designed for developer validation workflows. It solves one of the most common issues in software development: the lack of validation before building. 70% of side projects are abandoned because they didn't solve a real problem. PPS enables a structured research process from idea to first feedback in hours instead of weeks.

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

3. **Start local Supabase stack**:

   ```bash
   pnpm supabase:start
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

### `.agent/` - AI Engineering Logic

This folder contains rules and skills that empower AI assistants to act as specialized guardians of the codebase:

- **rules/**: Specialized AI "Guardians" (Supabase, I18n, Project Structure, etc.) that audit code in real-time to ensure it meets our architectural standards.
- **workflows/**: Standardized processes for common tasks like handling tickets or optimizing code.

---

Built with precision by **Pain Point Studio**.
