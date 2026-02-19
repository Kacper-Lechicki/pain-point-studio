/** Tests for the Supabase server auth provider that wraps SupabaseClient auth methods. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from '../types';
import { createServerAuthProvider } from './auth.server';

// ── Mock user-mapper ───────────────────────────────────────────────

vi.mock('./user-mapper', () => ({
  mapSupabaseUser: vi.fn((user: unknown) => user),
}));

// ── Helpers ────────────────────────────────────────────────────────

type MockFn = ReturnType<typeof vi.fn>;

interface MockSupabaseAuth {
  getUser: MockFn;
  signUp: MockFn;
  signInWithPassword: MockFn;
  signInWithOAuth: MockFn;
  signOut: MockFn;
  updateUser: MockFn;
  resetPasswordForEmail: MockFn;
  exchangeCodeForSession: MockFn;
  linkIdentity: MockFn;
  unlinkIdentity: MockFn;
}

function createMockSupabase() {
  return {
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      linkIdentity: vi.fn(),
      unlinkIdentity: vi.fn(),
    },
  } as unknown as SupabaseClient<Database>;
}

function mockAuth(supabase: SupabaseClient<Database>): MockSupabaseAuth {
  return (supabase as unknown as { auth: MockSupabaseAuth }).auth;
}

describe('createServerAuthProvider', () => {
  let supabase: SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createMockSupabase();
  });

  // ── getUser ────────────────────────────────────────────────────

  describe('getUser', () => {
    it('should call supabase.auth.getUser and map the returned user', async () => {
      const rawUser = { id: 'u-1', email: 'a@b.com' };

      mockAuth(supabase).getUser.mockResolvedValue({
        data: { user: rawUser },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.getUser();

      expect(mockAuth(supabase).getUser).toHaveBeenCalled();
      expect(result).toEqual({
        data: { user: rawUser },
        error: null,
      });
    });

    it('should return null user when supabase returns null user', async () => {
      mockAuth(supabase).getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.getUser();

      expect(result).toEqual({
        data: { user: null },
        error: null,
      });
    });

    it('should map error correctly when supabase returns error', async () => {
      mockAuth(supabase).getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired', status: 401 },
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.getUser();

      expect(result).toEqual({
        data: { user: null },
        error: { message: 'Session expired' },
      });
    });
  });

  // ── signUp ─────────────────────────────────────────────────────

  describe('signUp', () => {
    it('should pass email, password, and emailRedirectTo to supabase.auth.signUp', async () => {
      mockAuth(supabase).signUp.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      await provider.signUp({
        email: 'a@b.com',
        password: 'Pass1!',
        emailRedirectTo: 'http://localhost/callback',
      });

      expect(mockAuth(supabase).signUp).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'Pass1!',
        options: { emailRedirectTo: 'http://localhost/callback' },
      });
    });

    it('should not include options when emailRedirectTo is not provided', async () => {
      mockAuth(supabase).signUp.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      await provider.signUp({ email: 'a@b.com', password: 'Pass1!' });

      expect(mockAuth(supabase).signUp).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'Pass1!',
      });
    });

    it('should map error correctly', async () => {
      mockAuth(supabase).signUp.mockResolvedValue({
        data: {},
        error: { message: 'User already registered' },
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signUp({ email: 'a@b.com', password: 'Pass1!' });

      expect(result).toEqual({ error: { message: 'User already registered' } });
    });
  });

  // ── signInWithPassword ─────────────────────────────────────────

  describe('signInWithPassword', () => {
    it('should pass email and password, and return null error on success', async () => {
      mockAuth(supabase).signInWithPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signInWithPassword({
        email: 'a@b.com',
        password: 'Pass1!',
      });

      expect(mockAuth(supabase).signInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'Pass1!',
      });
      expect(result).toEqual({ error: null });
    });

    it('should map error when credentials are invalid', async () => {
      mockAuth(supabase).signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' },
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signInWithPassword({
        email: 'a@b.com',
        password: 'wrong',
      });

      expect(result).toEqual({ error: { message: 'Invalid login credentials' } });
    });
  });

  // ── signInWithOAuth ────────────────────────────────────────────

  describe('signInWithOAuth', () => {
    it('should pass provider and redirectTo in options, and return url', async () => {
      mockAuth(supabase).signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2' },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signInWithOAuth({
        provider: 'google',
        redirectTo: 'http://localhost/callback',
      });

      expect(mockAuth(supabase).signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost/callback' },
      });
      expect(result).toEqual({
        data: { url: 'https://accounts.google.com/o/oauth2' },
        error: null,
      });
    });

    it('should return null url when data.url is missing', async () => {
      mockAuth(supabase).signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signInWithOAuth({
        provider: 'github',
        redirectTo: 'http://localhost/callback',
      });

      expect(result).toEqual({
        data: { url: null },
        error: null,
      });
    });
  });

  // ── signOut ────────────────────────────────────────────────────

  describe('signOut', () => {
    it('should call supabase.auth.signOut and return null error', async () => {
      mockAuth(supabase).signOut.mockResolvedValue({ error: null });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signOut();

      expect(mockAuth(supabase).signOut).toHaveBeenCalled();
      expect(result).toEqual({ error: null });
    });

    it('should map error when sign-out fails', async () => {
      mockAuth(supabase).signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.signOut();

      expect(result).toEqual({ error: { message: 'Sign out failed' } });
    });
  });

  // ── updateUser ─────────────────────────────────────────────────

  describe('updateUser', () => {
    it('should build payload only with defined fields and pass emailRedirectTo', async () => {
      mockAuth(supabase).updateUser.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      await provider.updateUser(
        { email: 'new@b.com', data: { name: 'New' } },
        'http://localhost/confirm'
      );

      expect(mockAuth(supabase).updateUser).toHaveBeenCalledWith(
        { email: 'new@b.com', data: { name: 'New' } },
        { emailRedirectTo: 'http://localhost/confirm' }
      );
    });

    it('should skip emailRedirectTo when not provided', async () => {
      mockAuth(supabase).updateUser.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      await provider.updateUser({ password: 'NewPass1!' });

      expect(mockAuth(supabase).updateUser).toHaveBeenCalledWith(
        { password: 'NewPass1!' },
        undefined
      );
    });

    it('should only include fields that are defined in the payload', async () => {
      mockAuth(supabase).updateUser.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      await provider.updateUser({ email: 'x@y.com' });

      const firstCall = mockAuth(supabase).updateUser.mock.calls[0];
      expect(firstCall).toBeDefined();
      const [payload] = firstCall!;

      expect(payload).toEqual({ email: 'x@y.com' });
      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('data');
    });
  });

  // ── resetPasswordForEmail ──────────────────────────────────────

  describe('resetPasswordForEmail', () => {
    it('should pass email and options to supabase', async () => {
      mockAuth(supabase).resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.resetPasswordForEmail('a@b.com', {
        redirectTo: 'http://localhost/reset',
      });

      expect(mockAuth(supabase).resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
        redirectTo: 'http://localhost/reset',
      });
      expect(result).toEqual({ error: null });
    });
  });

  // ── exchangeCodeForSession ─────────────────────────────────────

  describe('exchangeCodeForSession', () => {
    it('should map the returned user through mapSupabaseUser', async () => {
      const rawUser = { id: 'u-2', email: 'b@c.com' };

      mockAuth(supabase).exchangeCodeForSession.mockResolvedValue({
        data: { user: rawUser, session: {} },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.exchangeCodeForSession('auth-code-123');

      expect(mockAuth(supabase).exchangeCodeForSession).toHaveBeenCalledWith('auth-code-123');
      expect(result).toEqual({
        data: { user: rawUser },
        error: null,
      });
    });

    it('should return null user when exchange returns no user', async () => {
      mockAuth(supabase).exchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.exchangeCodeForSession('bad-code');

      expect(result).toEqual({
        data: { user: null },
        error: null,
      });
    });
  });

  // ── linkIdentity ───────────────────────────────────────────────

  describe('linkIdentity', () => {
    it('should pass provider and redirectTo in options', async () => {
      mockAuth(supabase).linkIdentity.mockResolvedValue({
        data: {},
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.linkIdentity({
        provider: 'github',
        redirectTo: 'http://localhost/link',
      });

      expect(mockAuth(supabase).linkIdentity).toHaveBeenCalledWith({
        provider: 'github',
        options: { redirectTo: 'http://localhost/link' },
      });
      expect(result).toEqual({ error: null });
    });
  });

  // ── unlinkIdentity ─────────────────────────────────────────────

  describe('unlinkIdentity', () => {
    it('should look up the supabase identity and call unlinkIdentity with it', async () => {
      const supabaseIdentity = {
        identity_id: 'g-1',
        provider: 'google',
        id: 'internal-id',
      };

      mockAuth(supabase).getUser.mockResolvedValue({
        data: { user: { identities: [supabaseIdentity] } },
        error: null,
      });
      mockAuth(supabase).unlinkIdentity.mockResolvedValue({ error: null });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.unlinkIdentity({
        identityId: 'g-1',
        provider: 'google',
      });

      expect(mockAuth(supabase).unlinkIdentity).toHaveBeenCalledWith(supabaseIdentity);
      expect(result).toEqual({ error: null });
    });

    it('should return error when the identity is not found', async () => {
      mockAuth(supabase).getUser.mockResolvedValue({
        data: { user: { identities: [] } },
        error: null,
      });

      const provider = createServerAuthProvider(supabase);
      const result = await provider.unlinkIdentity({
        identityId: 'nonexistent',
        provider: 'google',
      });

      expect(mockAuth(supabase).unlinkIdentity).not.toHaveBeenCalled();
      expect(result).toEqual({ error: { message: 'Identity not found' } });
    });
  });
});
