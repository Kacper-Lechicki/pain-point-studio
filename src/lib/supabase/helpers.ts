/**
 * Shared Supabase type helpers. Provides ergonomic type aliases so feature
 * code doesn't need verbose Database['public']['Tables']['x']['Row'] paths.
 */

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
