import { createClient } from '@supabase/supabase-js';

import { env } from '../env';

/**
 * Creates a Supabase admin client using the service role key.
 * Only used for e2e test cleanup (e.g. deleting users created during tests).
 */
function getAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[e2e] SUPABASE_SERVICE_ROLE_KEY is required for admin cleanup operations.');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Ensures a confirmed user exists with the given credentials.
 * Handles race conditions when multiple Playwright projects run
 * beforeAll in parallel by retrying on failure.
 * Returns the user's id.
 */
export async function ensureUser(email: string, password: string): Promise<string> {
  const admin = getAdminClient();

  for (let attempt = 0; attempt < 3; attempt++) {
    await deleteUserByEmail(email).catch(() => {});

    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!error) {
      return data.user.id;
    }

    if (attempt === 2) {
      throw new Error(`[e2e] Failed to create user ${email}: ${error.message}`);
    }
  }

  throw new Error('[e2e] ensureUser: unexpected code path');
}

/**
 * Deletes a user by email from the local Supabase instance.
 * No-op if the user does not exist.
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  const admin = getAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);

  if (user) {
    await admin.auth.admin.deleteUser(user.id);
  }
}
