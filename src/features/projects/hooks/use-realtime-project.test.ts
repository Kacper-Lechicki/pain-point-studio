// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRealtimeProject } from './use-realtime-project';

const mockRefresh = vi.fn();
const mockRemoveChannel = vi.fn().mockResolvedValue(undefined);

let subscribeCallback: ((status: string) => void) | null = null;
const postgresHandlers: Array<() => void> = [];

const mockChannel = {
  on: vi.fn((_event: string, _filter: unknown, handler: () => void) => {
    postgresHandlers.push(handler);

    return mockChannel;
  }),
  subscribe: vi.fn((cb: (status: string) => void) => {
    subscribeCallback = cb;

    return mockChannel;
  }),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));

vi.mock('@/config/realtime', () => ({
  REALTIME_DEBOUNCE_MS: 100,
}));

describe('useRealtimeProject', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    subscribeCallback = null;
    postgresHandlers.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns isConnected=false initially', () => {
    const { result } = renderHook(() => useRealtimeProject());

    expect(result.current.isConnected).toBe(false);
  });

  it('sets isConnected=true when subscription is SUBSCRIBED', () => {
    const { result } = renderHook(() => useRealtimeProject());

    act(() => {
      subscribeCallback?.('SUBSCRIBED');
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('sets isConnected=false for non-SUBSCRIBED status', () => {
    const { result } = renderHook(() => useRealtimeProject());

    act(() => {
      subscribeCallback?.('SUBSCRIBED');
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      subscribeCallback?.('CLOSED');
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('subscribes to survey_responses and surveys tables', () => {
    renderHook(() => useRealtimeProject());

    expect(mockChannel.on).toHaveBeenCalledTimes(2);
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'survey_responses' },
      expect.any(Function)
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'surveys' },
      expect.any(Function)
    );
  });

  it('triggers debounced router.refresh on postgres changes', () => {
    renderHook(() => useRealtimeProject());

    // Trigger a postgres change
    act(() => {
      postgresHandlers[0]?.();
    });

    // Not called yet (debounced)
    expect(mockRefresh).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('debounces multiple rapid changes', () => {
    renderHook(() => useRealtimeProject());

    act(() => {
      postgresHandlers[0]?.();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    act(() => {
      postgresHandlers[1]?.();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onSync callback after refresh', () => {
    const onSync = vi.fn();

    renderHook(() => useRealtimeProject(onSync));

    act(() => {
      postgresHandlers[0]?.();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe when enabled=false', () => {
    const { result } = renderHook(() => useRealtimeProject(undefined, false));

    expect(result.current.isConnected).toBe(false);
    expect(mockChannel.subscribe).not.toHaveBeenCalled();
  });

  it('removes channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeProject());

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
