import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side variables - not available in the browser.
   * Attempting to use them in a Client Component will throw a build error.
   */
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },

  /**
   * Client-side variables - must start with NEXT_PUBLIC_.
   * Available in the browser.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },

  /**
   * Runtime environment binding.
   * Necessary for correct tree-shaking and variable detection.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Treat empty strings as undefined (validation error).
   * Helps avoid "silent errors" when a variable is empty.
   */
  emptyStringAsUndefined: true,
});
