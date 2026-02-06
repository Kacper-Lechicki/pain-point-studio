// @vitest-environment jsdom
import { Session } from '@supabase/supabase-js';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from './use-auth';

// Mock Supabase methods
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

const mockAuth = {
  getUser: mockGetUser,
  onAuthStateChange: mockOnAuthStateChange,
};

const mockSupabase = {
  auth: mockAuth,
};

// Mock Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({ data: { user: null } });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  // Verify that the hook starts in a loading state
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // Verify that the user is fetched correctly on mount
  it('should fetch and set user on mount', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };

    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  // Verify that the hook responds to real-time auth state changes
  it('should update state on auth state change (sign in)', async () => {
    const mockUser = { id: '456', email: 'new@example.com' };

    let authStateCallback: ((event: string, session: Session | null) => void) | undefined;

    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;

      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    if (authStateCallback) {
      authStateCallback('SIGNED_IN', { user: mockUser } as unknown as Session);
    }

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  // Verify subscription cleanup on unmount
  it('should unsubscribe from auth changes on unmount', () => {
    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
