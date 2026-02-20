/**
 * Shared Supabase type helpers. Provides ergonomic type aliases so feature
 * code doesn't need verbose Database['public']['Tables']['x']['Row'] paths.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

// ── Supabase client type alias ──────────────────────────────────────

/** Typed Supabase client. Use this instead of bare SupabaseClient. */
export type TypedSupabaseClient = SupabaseClient<Database>;

// ── App-level user types ────────────────────────────────────────────

/** App-level identity (OAuth provider link). */
export interface AppIdentity {
  identityId: string;
  provider: string;
  email?: string;
  identityData?: Record<string, unknown>;
}

/** App-level authenticated user. */
export interface AppUser {
  id: string;
  email: string;
  identities: AppIdentity[];
  userMetadata: Record<string, unknown>;
  createdAt: string;
}
