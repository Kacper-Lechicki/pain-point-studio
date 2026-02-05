// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @supabase/ssr before any imports
const mockCreateBrowserClient = vi.fn().mockReturnValue({ from: vi.fn() });
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

// Mock env
vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('Supabase Browser Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createBrowserClient with correct env values', async () => {
    const { createClient } = await import('./client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith('http://127.0.0.1:54321', 'test-anon-key');
  });

  it('should call createBrowserClient exactly once per invocation', async () => {
    const { createClient } = await import('./client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
  });
});
