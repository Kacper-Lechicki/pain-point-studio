/**
 * Supabase implementation of the AuthProvider interface for server-side usage.
 * Wraps a server Supabase client (cookie-based session).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthProvider } from '@/lib/providers/auth';
import type { AppIdentity } from '@/lib/providers/types';

import type { Database } from '../types';
import { mapSupabaseUser } from './user-mapper';

export function createServerAuthProvider(supabase: SupabaseClient<Database>): AuthProvider {
  return {
    async getUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      return {
        data: { user: user ? mapSupabaseUser(user) : null },
        error: error ? { message: error.message } : null,
      };
    },

    async signUp({ email, password, emailRedirectTo }) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
      });

      return { error: error ? { message: error.message } : null };
    },

    async signInWithPassword({ email, password }) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      return { error: error ? { message: error.message } : null };
    },

    async signInWithOAuth({ provider, redirectTo }) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      return {
        data: { url: data?.url ?? null },
        error: error ? { message: error.message } : null,
      };
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();

      return { error: error ? { message: error.message } : null };
    },

    async updateUser(options, emailRedirectTo) {
      const updatePayload: Record<string, unknown> = {};

      if (options.email !== undefined) {
        updatePayload.email = options.email;
      }

      if (options.password !== undefined) {
        updatePayload.password = options.password;
      }

      if (options.data !== undefined) {
        updatePayload.data = options.data;
      }

      const { error } = await supabase.auth.updateUser(
        updatePayload,
        emailRedirectTo ? { emailRedirectTo } : undefined
      );

      return { error: error ? { message: error.message } : null };
    },

    async resetPasswordForEmail(email, options) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, options);

      return { error: error ? { message: error.message } : null };
    },

    async exchangeCodeForSession(code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      return {
        data: { user: data?.user ? mapSupabaseUser(data.user) : null },
        error: error ? { message: error.message } : null,
      };
    },

    async linkIdentity({ provider, redirectTo }) {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo },
      });

      return { error: error ? { message: error.message } : null };
    },

    async unlinkIdentity(identity: AppIdentity) {
      // Map AppIdentity back to the shape Supabase expects
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const supabaseIdentity = user?.identities?.find(
        (i) => i.identity_id === identity.identityId && i.provider === identity.provider
      );

      if (!supabaseIdentity) {
        return { error: { message: 'Identity not found' } };
      }

      const { error } = await supabase.auth.unlinkIdentity(supabaseIdentity);

      return { error: error ? { message: error.message } : null };
    },
  };
}
