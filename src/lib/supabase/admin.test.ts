// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateClient = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

// ── createAdminClient ───────────────────────────────────────────────

describe('createAdminClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // With key set, createClient is called with url and key.
  it('calls createClient with url and service role key when key is set', async () => {
    const { createAdminClient } = await import('./admin');
    createAdminClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-role-key',
      expect.objectContaining({
        auth: { autoRefreshToken: false, persistSession: false },
      })
    );
  });

  // When key is falsy, throws with message containing SUPABASE_SERVICE_ROLE_KEY.
  it('throws when SUPABASE_SERVICE_ROLE_KEY is falsy', async () => {
    vi.doMock('@/lib/common/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: '',
      },
    }));
    vi.resetModules();
    const { createAdminClient } = await import('./admin');

    expect(() => createAdminClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY');
  });
});
