/**
 * Maps the Supabase `User` type to the app-level `AppUser` type.
 * This is the ONLY file that should import `User` from @supabase/supabase-js.
 */
import type { User } from '@supabase/supabase-js';

import type { AppUser } from '@/lib/supabase/helpers';

export function mapSupabaseUser(user: User): AppUser {
  return {
    id: user.id,
    email: user.email ?? '',
    identities: (user.identities ?? []).map((i) => {
      const email = i.identity_data?.email as string | undefined;
      const identityData = i.identity_data as Record<string, unknown> | undefined;

      return {
        identityId: i.identity_id,
        provider: i.provider,
        ...(email !== undefined ? { email } : {}),
        ...(identityData !== undefined ? { identityData } : {}),
      };
    }),
    userMetadata: (user.user_metadata ?? {}) as Record<string, unknown>,
    createdAt: user.created_at ?? '',
  };
}
