/** Tests for the Supabase SessionMiddleware provider. */
import type { NextRequest, NextResponse } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupabaseSessionMiddleware } from './middleware';

// ── Mocks ────────────────────────────────────────────────────────

const mockUpdateSession = vi.fn();

vi.mock('../middleware', () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock('./user-mapper', () => ({
  mapSupabaseUser: vi.fn((user: unknown) => ({
    ...(user as Record<string, unknown>),
    _mapped: true,
  })),
}));

describe('createSupabaseSessionMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabaseUpdateSession and map the user when present', async () => {
    const fakeRequest = {} as NextRequest;
    const fakeResponse = {} as NextResponse;
    const rawUser = { id: 'u-1', email: 'a@b.com' };

    mockUpdateSession.mockResolvedValue({
      response: fakeResponse,
      user: rawUser,
    });

    const middleware = createSupabaseSessionMiddleware();
    const result = await middleware.updateSession(fakeRequest);

    expect(mockUpdateSession).toHaveBeenCalledWith(fakeRequest);
    expect(result.response).toBe(fakeResponse);
    expect(result.user).toEqual({ ...rawUser, _mapped: true });
  });

  it('should return null user when supabase returns null user', async () => {
    const fakeRequest = {} as NextRequest;
    const fakeResponse = {} as NextResponse;

    mockUpdateSession.mockResolvedValue({
      response: fakeResponse,
      user: null,
    });

    const middleware = createSupabaseSessionMiddleware();
    const result = await middleware.updateSession(fakeRequest);

    expect(result.response).toBe(fakeResponse);
    expect(result.user).toBeNull();
  });
});
