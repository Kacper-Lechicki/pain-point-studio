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
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_AUTH_REDIRECT_URI: z.url().min(1),
    SUPABASE_AUTH_GITHUB_CLIENT_ID: z.string().min(1),
    SUPABASE_AUTH_GITHUB_SECRET: z.string().min(1),
    SUPABASE_AUTH_GOOGLE_CLIENT_ID: z.string().min(1),
    SUPABASE_AUTH_GOOGLE_SECRET: z.string().min(1),
  },

  /**
   * Client-side variables - must start with NEXT_PUBLIC_.
   * Available in the browser.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.url().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
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
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_AUTH_REDIRECT_URI: process.env.SUPABASE_AUTH_REDIRECT_URI,
    SUPABASE_AUTH_GITHUB_CLIENT_ID: process.env.SUPABASE_AUTH_GITHUB_CLIENT_ID,
    SUPABASE_AUTH_GITHUB_SECRET: process.env.SUPABASE_AUTH_GITHUB_SECRET,
    SUPABASE_AUTH_GOOGLE_CLIENT_ID: process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID,
    SUPABASE_AUTH_GOOGLE_SECRET: process.env.SUPABASE_AUTH_GOOGLE_SECRET,

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
