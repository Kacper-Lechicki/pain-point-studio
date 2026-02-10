import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
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
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().min(1),
    SMTP_KEY: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.url().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  },

  runtimeEnv: {
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
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_KEY: process.env.SMTP_KEY,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },

  emptyStringAsUndefined: true,
});
