/**
 * Server-side provider factories.
 *
 * Feature code imports these instead of directly referencing
 * the Supabase implementations. Swapping to a different backend
 * only requires changing the imports in this file.
 */
import { mapSupabaseError } from '@/lib/supabase/errors';
import { createSupabaseAuthAdmin } from '@/lib/supabase/providers/auth-admin';
import { createServerAuthProvider } from '@/lib/supabase/providers/auth.server';
import { createSupabaseDatabaseClient } from '@/lib/supabase/providers/database';
import { createServerStorageProvider } from '@/lib/supabase/providers/storage.server';
import { createClient } from '@/lib/supabase/server';

import type { AuthProvider } from './auth';
import type { AuthAdminProvider } from './auth-admin';
import type { DatabaseClient } from './database';
import type { StorageProvider } from './storage';

/**
 * Create all server-side providers from a single Supabase client.
 * Useful for data-fetching functions that need auth + db.
 */
export async function createServerProviders(): Promise<{
  auth: AuthProvider;
  db: DatabaseClient;
  storage: StorageProvider;
}> {
  const supabase = await createClient();

  return {
    auth: createServerAuthProvider(supabase),
    db: createSupabaseDatabaseClient(supabase),
    storage: createServerStorageProvider(supabase),
  };
}

/** Create a server auth provider (requires an async Supabase client). */
export async function createServerAuth(): Promise<AuthProvider> {
  const supabase = await createClient();

  return createServerAuthProvider(supabase);
}

/** Create a server database client. */
export async function createServerDatabase(): Promise<DatabaseClient> {
  const supabase = await createClient();

  return createSupabaseDatabaseClient(supabase);
}

/** Create an admin auth provider (service-role, bypasses RLS). */
export function createAuthAdmin(): AuthAdminProvider {
  return createSupabaseAuthAdmin();
}

/**
 * Map a provider error message to an i18n key.
 * Decouples feature code from the Supabase error catalogue.
 */
export { mapSupabaseError as mapAuthError };
