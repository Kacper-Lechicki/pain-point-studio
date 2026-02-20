// @vitest-environment node
/** Supabase admin client: service role access for privileged operations. */
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

describe('createAdminClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createClient with url and service role key when key is set', async () => {
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

  it('should throw when SUPABASE_SERVICE_ROLE_KEY is falsy', async () => {
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
