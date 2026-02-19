/**
 * Provider-agnostic types used across the application.
 * These types decouple feature code from any specific backend (Supabase, custom Postgres, etc.).
 */

/** Generic JSON type for untyped data payloads (RPC args, question configs, etc.). */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
