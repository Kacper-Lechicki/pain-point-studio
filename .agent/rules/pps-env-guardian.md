---
trigger: always_on
---

# Skill: PPS Environment Variable Guardian

## Description

Validates and optimizes environment variable usage in Pain Point Studio to ensure type safety, proper server/client separation, and secure configuration management. Prevents common pitfalls like exposing secrets to the client or missing required variables.

## Triggers

Use this skill when:

- Adding new environment variables
- Reviewing code that uses `process.env`
- Debugging "Invalid environment variables" errors
- Setting up new deployment environments
- Reviewing security-sensitive code
- Someone asks "why isn't my env var working?"
- Migrating from direct `process.env` to typed `env`
- Preparing for deployment

## Instructions

You are the environment configuration auditor for Pain Point Studio. Your job is to ensure all environment variables are type-safe, properly scoped (server vs client), and securely managed.

### Core Validation Checklist

**1. Type-Safe Access**

- [ ] All env vars imported from `@/lib/common/env`, never `process.env`
- [ ] No direct `process.env.VAR_NAME` usage anywhere
- [ ] Autocompletion works (TypeScript types match Zod schema)
- [ ] No `string | undefined` types (all validated at build time)

**2. Server/Client Separation**

- [ ] Server-only vars in `server` section of schema
- [ ] Public vars in `client` section with `NEXT_PUBLIC_` prefix
- [ ] Client components don't access server-only vars
- [ ] Server components can access both server and client vars

**3. Schema Validation**

- [ ] All vars defined in `src/lib/env.ts` Zod schema
- [ ] Schema matches actual usage (types, formats, optional/required)
- [ ] `runtimeEnv` mapping includes all vars (Next.js requirement)
- [ ] Build fails fast if required vars missing

**4. Documentation & Security**

- [ ] `.env.example` updated with new vars
- [ ] Secrets documented in Bitwarden (not in code)
- [ ] No hardcoded secrets or tokens
- [ ] Vercel environment configured for deployments

### Response Format

When reviewing environment variable usage, provide:

**Status:** ✅ Compliant | ⚠️ Needs fixes | ❌ Security risk

**Issues Found:**

```
[Critical] Secret leaked to client
[Error] Direct process.env usage
[Warning] Missing .env.example entry
[Info] Could use URL validation
```

**Suggested Fixes:**
Specific code changes with explanations

**Verification:**

- Build succeeds ✓/✗
- No secrets exposed ✓/✗
- Types correctly inferred ✓/✗

### Common Issues & Fixes

**Issue 1: Direct process.env Usage**

```typescript
// ❌ Bad: No type safety, can be undefined
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ Good: Type-safe, validated at build
import { env } from '@/lib/common/env';
const apiUrl = env.NEXT_PUBLIC_API_URL;
```

**Issue 2: Server Secret in Client Component**

```typescript
// ❌ Bad: Exposes secret to browser
'use client';
import { env } from '@/lib/common/env';

export default function Component() {
  const secret = env.DATABASE_URL; // ❌ Server-only!
  return <div>{secret}</div>;
}

// ✅ Good: Use server action or API route
'use client';

export default function Component() {
  const handleAction = async () => {
    await serverAction(); // Server action accesses env.DATABASE_URL
  };
  return <button onClick={handleAction}>Action</button>;
}
```

**Issue 3: Missing NEXT*PUBLIC* Prefix**

```typescript
// ❌ Bad: Won't work in browser
// src/lib/env.ts
client: z.object({
  APP_URL: z.string().url(), // ❌ Missing prefix
});

// ✅ Good: Proper prefix
client: z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});
```

**Issue 4: Missing runtimeEnv Mapping**

```typescript
// ❌ Bad: Schema defined but not mapped
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  runtimeEnv: {
    // ❌ Missing DATABASE_URL mapping
  },
});

// ✅ Good: Complete mapping
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
});
```

**Issue 5: Weak Validation**

```typescript
// ❌ Bad: Any string accepted
server: z.object({
  DATABASE_URL: z.string(),
  API_KEY: z.string(),
});

// ✅ Good: Format validation
server: z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  API_KEY: z.string().min(32),
});
```

**Issue 6: Missing .env.example**

```bash
# ❌ Bad: New var added but example not updated
# .env.example has no entry for NEW_VAR

# ✅ Good: Always update example
# .env.example
NEW_VAR=your_value_here
```

### Adding New Environment Variable Workflow

**Step-by-step process:**

1. **Define in `src/lib/env.ts`**

```typescript
export const env = createEnv({
  server: {
    // Add here if server-only
    NEW_SECRET_KEY: z.string().min(32),
  },
  client: {
    // Add here if public (must start with NEXT_PUBLIC_)
    NEXT_PUBLIC_NEW_FEATURE: z.enum(['enabled', 'disabled']),
  },
  runtimeEnv: {
    // Map both server and client vars
    NEW_SECRET_KEY: process.env.NEW_SECRET_KEY,
    NEXT_PUBLIC_NEW_FEATURE: process.env.NEXT_PUBLIC_NEW_FEATURE,
  },
});
```

2. **Update `.env.example`**

```bash
# Add with description
NEW_SECRET_KEY=changeme_min_32_chars
NEXT_PUBLIC_NEW_FEATURE=enabled
```

3. **Set locally in `.env`**

```bash
NEW_SECRET_KEY=actual_secret_value_here_32chars
NEXT_PUBLIC_NEW_FEATURE=enabled
```

4. **Document in Bitwarden** (if secret)
   - Add to "PPS Environment Variables" vault
   - Include: var name, purpose, where used

5. **Configure in Vercel**
   - Go to Project Settings → Environment Variables
   - Add for Preview and Production
   - Mark as "secret" if sensitive

### Validation Strategy

**Build-time validation:**

```typescript
// src/lib/env.ts uses @t3-oss/env-nextjs
// Automatically validates on build:
// - pnpm build
// - pnpm dev
// - Vercel deployments

// If validation fails, build stops with clear error:
// ❌ Invalid environment variables:
//    DATABASE_URL: Required
//    NEXT_PUBLIC_API_URL: Invalid url
```

**Runtime checks (optional):**

```typescript
// For dynamic validation in server actions
import { env } from '@/lib/common/env';

export async function serverAction() {
  // env vars are guaranteed to exist and be typed
  const dbUrl = env.DATABASE_URL; // string (not string | undefined)

  // Additional runtime validation if needed
  if (!dbUrl.includes('production')) {
    throw new Error('Not production database');
  }
}
```

### Server vs Client Decision Tree

```
Is the variable sensitive (API keys, database URLs, secrets)?
├─ YES → Server-only
│   └─ Add to `server` section in env.ts
│   └─ Access only in server components, API routes, server actions
│
└─ NO → Is it needed in the browser?
    ├─ YES → Client variable
    │   └─ Add to `client` section with NEXT_PUBLIC_ prefix
    │   └─ Can access anywhere (server or client)
    │
    └─ NO → Server-only (even if not secret)
        └─ Keep server-only to reduce bundle size
```

### Security Checklist

- [ ] No secrets in Git (check `.env` is in `.gitignore`)
- [ ] No secrets in client components
- [ ] No secrets in error messages shown to users
- [ ] No `console.log` of sensitive env vars
- [ ] Bitwarden updated with all production secrets
- [ ] Vercel secrets marked as "sensitive"
- [ ] No hardcoded fallbacks for secrets

### Common Errors & Solutions

**Error: "Invalid environment variables"**

```
Solution:
1. Check terminal output for missing vars
2. Verify .env file exists and is loaded
3. Check spelling matches env.ts schema
4. Ensure no extra whitespace in .env
5. Restart dev server after changes
```

**Error: "process.env is not defined" in browser**

```
Solution:
1. Variable must have NEXT_PUBLIC_ prefix
2. Move to `client` section in env.ts
3. Add to runtimeEnv mapping
4. Rebuild application
```

**Error: "env.VAR_NAME is undefined"**

```
Solution:
1. Check VAR_NAME exists in env.ts schema
2. Verify runtimeEnv mapping includes it
3. Ensure .env file has the value
4. Restart dev server
```

### Integration with PPS Context

Remember:

- PPS handles sensitive user data (GDPR compliance)
- Multi-tenancy requires careful env separation
- Performance: only expose client vars when necessary
- Privacy by default: server vars for user data access
- MVP focus: don't over-engineer, but be secure

**PPS-specific variables:**

```typescript
// Typical PPS env structure
server: {
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
}

client: {
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string(),
}
```

### Quick Reference Table

| Scenario     | Location | Prefix         | Access From |
| ------------ | -------- | -------------- | ----------- |
| Database URL | `server` | None           | Server only |
| API secret   | `server` | None           | Server only |
| Analytics ID | `client` | `NEXT_PUBLIC_` | Anywhere    |
| App URL      | `client` | `NEXT_PUBLIC_` | Anywhere    |
| Feature flag | `client` | `NEXT_PUBLIC_` | Anywhere    |
| Auth secret  | `server` | None           | Server only |

### Audit Workflow

When reviewing code:

1. **Search for `process.env`**

   ```bash
   # Should return zero results except in env.ts
   grep -r "process.env" src/
   ```

2. **Verify imports**

   ```typescript
   // ✅ All env usage should look like this
   import { env } from '@/lib/common/env';

   const url = env.NEXT_PUBLIC_APP_URL;
   ```

3. **Check client components**

   ```typescript
   // Scan for 'use client' + server env usage
   // Should find zero instances
   ```

4. **Validate .env.example**
   ```bash
   # Compare env.ts schema with .env.example
   # All vars should be documented
   ```

### What NOT to Do

- Don't access `process.env` directly (except in `env.ts`)
- Don't add secrets without Bitwarden documentation
- Don't use server vars in client components
- Don't commit `.env` to Git
- Don't skip `.env.example` updates
- Don't use weak validation (accept any string)
- Don't expose implementation details in var names

### Critical Rules

1. **All env access through `@/lib/common/env`** - no exceptions
2. **Server secrets stay server-side** - never leaked to client
3. **Build must fail on missing vars** - no silent failures
4. **Documentation always updated** - `.env.example` + Bitwarden
5. **Type safety enforced** - Zod validation catches issues early

---

**Remember:** Environment variables are the foundation of secure configuration. One leaked secret can compromise the entire application. Treat every variable with care, validate strictly, and maintain clear documentation.
