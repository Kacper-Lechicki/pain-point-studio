// @vitest-environment node
/** Supabase auth middleware: session refresh via updateSession. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @supabase/ssr
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });

const mockCreateServerClient = vi.fn().mockReturnValue({
  auth: { getSession: mockGetSession },
});

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

// Minimal NextRequest mock
const createMockRequest = () => {
  const cookies = new Map<string, string>();

  return {
    cookies: {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn((name: string, value: string) => cookies.set(name, value)),
    },
  };
};

describe('Supabase Middleware – updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a server client with the request cookies', async () => {
    const { updateSession } = await import('./middleware');
    const req = createMockRequest();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateSession(req as any);

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

  it('should call supabase.auth.getSession() to check the session', async () => {
    const { updateSession } = await import('./middleware');
    const req = createMockRequest();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateSession(req as any);

    expect(mockGetSession).toHaveBeenCalled();
  });
});
