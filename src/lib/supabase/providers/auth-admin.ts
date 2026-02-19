/**
 * Supabase implementation of the AuthAdminProvider interface.
 * Uses the service role key to bypass RLS for privileged operations.
 */
import type { AuthAdminProvider } from '@/lib/providers/auth-admin';

import { createAdminClient } from '../admin';

export function createSupabaseAuthAdmin(): AuthAdminProvider {
  const admin = createAdminClient();

  return {
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);

      return { error: error ? { message: error.message } : null };
    },

    async updateUserById(userId, data) {
      const { error } = await admin.auth.admin.updateUserById(userId, data);

      return { error: error ? { message: error.message } : null };
    },
  };
}
