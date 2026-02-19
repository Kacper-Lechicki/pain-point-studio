/**
 * Provider-agnostic auth interface. Implemented by Supabase (or any future
 * auth provider). Feature code depends only on this interface.
 */
import type { AppIdentity, AppUser } from './types';

// ── Option types ────────────────────────────────────────────────────

export interface AuthSignUpOptions {
  email: string;
  password: string;
  emailRedirectTo?: string;
}

export interface AuthSignInOptions {
  email: string;
  password: string;
}

export interface AuthOAuthOptions {
  provider: 'google' | 'github';
  redirectTo: string;
}

export interface AuthUpdateUserOptions {
  email?: string;
  password?: string;
  data?: Record<string, unknown>;
}

// ── Result types ────────────────────────────────────────────────────

export interface AuthError {
  message: string;
}

export interface AuthResult<T = void> {
  data?: T;
  error: AuthError | null;
}

export interface AuthStateSubscription {
  unsubscribe: () => void;
}

// ── Interface ───────────────────────────────────────────────────────

export interface AuthProvider {
  getUser(): Promise<AuthResult<{ user: AppUser | null }>>;

  signUp(options: AuthSignUpOptions): Promise<AuthResult>;
  signInWithPassword(options: AuthSignInOptions): Promise<AuthResult>;
  signInWithOAuth(options: AuthOAuthOptions): Promise<AuthResult<{ url: string | null }>>;
  signOut(): Promise<AuthResult>;

  updateUser(options: AuthUpdateUserOptions, emailRedirectTo?: string): Promise<AuthResult>;
  resetPasswordForEmail(email: string, options: { redirectTo: string }): Promise<AuthResult>;

  exchangeCodeForSession(code: string): Promise<AuthResult<{ user: AppUser | null }>>;

  linkIdentity(options: AuthOAuthOptions): Promise<AuthResult>;
  unlinkIdentity(identity: AppIdentity): Promise<AuthResult>;

  /** Browser-only: subscribe to auth state changes. */
  onAuthStateChange?(callback: (event: string, user: AppUser | null) => void): {
    data: { subscription: AuthStateSubscription };
  };
}
