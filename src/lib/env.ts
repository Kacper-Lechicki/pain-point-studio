import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side variables - not available in the browser.
   * Attempting to use them in a Client Component will throw a build error.
   */
  server: {
    CI: z.string().optional(),
    STANDALONE: z.string().optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    BASIC_AUTH_USER: z.string().optional(),
    BASIC_AUTH_PASSWORD: z.string().optional(),
  },

  /**
   * Client-side variables - must start with NEXT_PUBLIC_.
   * Available in the browser.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.url().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },

  /**
   * Runtime environment binding.
   * Necessary for correct tree-shaking and variable detection.
   */
  runtimeEnv: {
    // Server
    CI: process.env.CI,
    STANDALONE: process.env.STANDALONE,
    NODE_ENV: process.env.NODE_ENV,
    BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
    BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },

  /**
   * Treat empty strings as undefined (validation error).
   * Helps avoid "silent errors" when a variable is empty.
   */
  emptyStringAsUndefined: true,
});
