// @vitest-environment node
/** Supabase server client creation with cookie management. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/headers
const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Mock @supabase/ssr
const mockCreateServerClient = vi.fn().mockReturnValue({ from: vi.fn() });

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

// Mock env
vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('Supabase Server Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createServerClient with correct env values', async () => {
    const { createClient } = await import('./server');
    await createClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'http://127.0.0.1:54321',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it('should provide a working getAll cookie handler', async () => {
    const { createClient } = await import('./server');
    await createClient();

    const lastCall = mockCreateServerClient.mock.calls.at(-1) as unknown[];
    const options = lastCall?.[2] as { cookies: { getAll: () => void } } | undefined;

    options?.cookies.getAll();

    expect(mockCookieStore.getAll).toHaveBeenCalled();
  });
});
