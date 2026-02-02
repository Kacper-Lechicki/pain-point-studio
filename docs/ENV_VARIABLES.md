# Environment Variable Management

At Pain Point Studio, we treat configuration as code. We use **Type-Safe Environment Variables** to ensure safety, validation, and autocompletion.

## 🛡 Philosophy

1.  **Strict Validation:** The application should not build if required keys are missing.
2.  **Type Safety:** `env.NEXT_PUBLIC_APP_URL` is a guaranteed string, not `string | undefined`.
3.  **Secrets Management:** Maintain secrets in Bitwarden, never in Git.

## 🚀 How to add a new variable?

1.  **Add definition in `src/lib/env.ts`:**
    - If it's a server-side secret: `server` section.
    - If it's a public variable (e.g., analytics ID): `client` section (must include `NEXT_PUBLIC_` prefix).
2.  **Add mapping in `runtimeEnv`:** (In the same file - a Next.js technical limitation for client-side bundling).
3.  **Update `.env.example`:** Add the key with an empty/default value for the team.
4.  **Set value locally:** In your `.env` file.
5.  **Add to Bitwarden:** If it's a shared secret.
6.  **Configure in Vercel:** For Preview/Production environments.

## 💻 Usage in Code

Instead of `process.env.VAR_NAME`, import the `env` object:

```typescript
import { env } from '@/lib/env';

// ✅ Type-safe, guaranteed values
console.log(env.NEXT_PUBLIC_APP_URL);
```

## ⚠️ Troubleshooting

**Error: `Invalid environment variables` during build/start**

Your environment does not satisfy the schema defined in `src/lib/env.ts`. Check the error message to see which key is missing or has an invalid format.

**Error: `process.env is not defined` in browser**

Ensure you are using `env.NEXT_PUBLIC_...`. Variables from the `server` section are stripped from client-side code for security.

---

## AI Optimization Instructions

> **For AI assistants auditing files according to this document:**
>
> I will provide you with files that use environment variables, and you will verify and optimize them according to these instructions, ensuring that their behavior remains unchanged.
>
> **Key rules:**
>
> 1. Verify all env vars are imported from `@/lib/env`, not `process.env`
> 2. Check that client-side code only uses `NEXT_PUBLIC_*` variables
> 3. Ensure server-only variables are not leaked to client components
> 4. Validate that `.env.example` is updated when new vars are added
> 5. Confirm Zod schemas in `env.ts` match actual usage
> 6. **Do not change variable values or logic** - only fix access patterns
> 7. Functionality must remain **identical**
