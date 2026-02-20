// @vitest-environment jsdom
/** useAuth hook: auth state management, user fetching, and subscription cleanup. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppUser } from '@/lib/supabase/helpers';

import { useAuth } from './use-auth';

// Mock provider methods
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

// Mock the Supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

// Mock the user mapper to pass through the value as-is
vi.mock('@/lib/supabase/user-mapper', () => ({
  mapSupabaseUser: (user: AppUser) => user,
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({ data: { user: null } });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('should return loading state initially', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fetch and set user on mount', async () => {
    const mockUser: AppUser = {
      id: '123',
      email: 'test@example.com',
      identities: [],
      userMetadata: {},
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should update state on auth state change (sign in)', async () => {
    const mockUser: AppUser = {
      id: '456',
      email: 'new@example.com',
      identities: [],
      userMetadata: {},
      createdAt: '2024-01-01T00:00:00Z',
    };

    let authStateCallback: ((event: string, session: { user: AppUser } | null) => void) | undefined;

    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;

      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    await act(async () => {
      authStateCallback?.('SIGNED_IN', { user: mockUser });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should unsubscribe from auth changes on unmount', () => {
    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
