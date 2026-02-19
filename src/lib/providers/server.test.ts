/** Tests for the server-side provider factory that decouples feature code from Supabase. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAuthAdmin,
  createServerAuth,
  createServerDatabase,
  createServerProviders,
  mapAuthError,
} from './server';

// ── Mocks ────────────────────────────────────────────────────────

const mockSupabaseClient = { __brand: 'supabase' };
const mockAuthProvider = { __brand: 'auth' };
const mockDbClient = { __brand: 'db' };
const mockStorageProvider = { __brand: 'storage' };
const mockAuthAdmin = { __brand: 'authAdmin' };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock('@/lib/supabase/providers/auth.server', () => ({
  createServerAuthProvider: vi.fn(() => mockAuthProvider),
}));

vi.mock('@/lib/supabase/providers/database', () => ({
  createSupabaseDatabaseClient: vi.fn(() => mockDbClient),
}));

vi.mock('@/lib/supabase/providers/storage.server', () => ({
  createServerStorageProvider: vi.fn(() => mockStorageProvider),
}));

vi.mock('@/lib/supabase/providers/auth-admin', () => ({
  createSupabaseAuthAdmin: vi.fn(() => mockAuthAdmin),
}));

vi.mock('@/lib/supabase/errors', () => ({
  mapSupabaseError: vi.fn((msg: string) => `mapped:${msg}`),
}));

describe('Server provider factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createServerProviders', () => {
    it('should create a single supabase client and return auth, db, storage', async () => {
      const { auth, db, storage } = await createServerProviders();

      expect(auth).toBe(mockAuthProvider);
      expect(db).toBe(mockDbClient);
      expect(storage).toBe(mockStorageProvider);
    });

    it('should share the same supabase client across all providers', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { createServerAuthProvider } = await import('@/lib/supabase/providers/auth.server');
      const { createSupabaseDatabaseClient } = await import('@/lib/supabase/providers/database');
      const { createServerStorageProvider } =
        await import('@/lib/supabase/providers/storage.server');

      await createServerProviders();

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(createServerAuthProvider).toHaveBeenCalledWith(mockSupabaseClient);
      expect(createSupabaseDatabaseClient).toHaveBeenCalledWith(mockSupabaseClient);
      expect(createServerStorageProvider).toHaveBeenCalledWith(mockSupabaseClient);
    });
  });

  describe('createServerAuth', () => {
    it('should create supabase client and return auth provider', async () => {
      const auth = await createServerAuth();

      expect(auth).toBe(mockAuthProvider);
    });
  });

  describe('createServerDatabase', () => {
    it('should create supabase client and return database client', async () => {
      const db = await createServerDatabase();

      expect(db).toBe(mockDbClient);
    });
  });

  describe('createAuthAdmin', () => {
    it('should return auth admin provider', () => {
      const admin = createAuthAdmin();

      expect(admin).toBe(mockAuthAdmin);
    });
  });

  describe('mapAuthError', () => {
    it('should re-export mapSupabaseError as mapAuthError', () => {
      const result = mapAuthError('Invalid login credentials');

      expect(result).toBe('mapped:Invalid login credentials');
    });
  });
});
