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

---

Built with precision by **Pain Point Studio**.
