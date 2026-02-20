import { expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import { env } from './env';
import { ROUTES, url } from './routes';
import { E2E_PASSWORD } from './selectors';

const DEFAULT_PASSWORD = E2E_PASSWORD;

/**
 * Generates a project-scoped email to prevent collisions when
 * multiple Playwright projects run against the same Supabase instance.
 */
export function scopedEmail(base: string, projectName: string) {
  const slug = projectName.toLowerCase().replace(/\s+/g, '-');

  return `${base}+${slug}@example.com`;
}

// ── API-based sign-in (fast, reliable) ───────────────────────────
//
// Calls GoTrue via the Supabase JS client (Node.js, not the browser),
// then injects the returned session as cookies into the Playwright
// browser context. This bypasses the sign-in form entirely and is
// immune to hydration issues, form-submit races, and GoTrue slowness
// under load (a single API call instead of fill → submit → redirect).

/**
 * Signs in via the Supabase API and navigates the page to the dashboard.
 * Use this for any test that needs an authenticated session but doesn't
 * test the sign-in form itself.
 */
export function makeApiSignIn(email: string, password = DEFAULT_PASSWORD) {
  return async function apiSignIn(page: import('@playwright/test').Page) {
    // 1. Authenticate via GoTrue REST API
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      throw new Error(`[e2e] API signIn failed for ${email}: ${error?.message ?? 'no session'}`);
    }

    // 2. Build the cookie value that @supabase/ssr expects.
    //    The cookie name follows the pattern: sb-<project-ref>-auth-token
    //    where project-ref is extracted from the Supabase URL (the hostname segment).
    const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    const cookieValue = JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    });

    // 3. Supabase SSR stores long tokens in chunks of ~3180 chars.
    //    We replicate that chunking so the middleware can read them.
    const CHUNK_SIZE = 3180;
    const baseUrl = new URL(env.NEXT_PUBLIC_APP_URL);

    const cookieBase = {
      domain: baseUrl.hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    };

    if (cookieValue.length <= CHUNK_SIZE) {
      await page
        .context()
        .addCookies([{ ...cookieBase, name: `${cookieName}.0`, value: cookieValue }]);
    } else {
      const chunks: { name: string; value: string }[] = [];

      for (let i = 0; i * CHUNK_SIZE < cookieValue.length; i++) {
        chunks.push({
          name: `${cookieName}.${i}`,
          value: cookieValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        });
      }

      await page.context().addCookies(chunks.map((c) => ({ ...cookieBase, ...c })));
    }

    // 4. Navigate to the dashboard — middleware reads the cookies and
    //    validates the session, so the page renders as authenticated.
    await page.goto(url(ROUTES.common.dashboard), { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  };
}
