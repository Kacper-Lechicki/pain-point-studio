// @vitest-environment jsdom
/** useRealtimeResponses: Supabase Realtime subscription with debounced router.refresh(). */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRealtimeResponses } from './use-realtime-responses';

// ── Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockSubscribe: vi.fn(),
  mockRemoveChannel: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.mockRefresh }),
}));

vi.mock('@/features/surveys/config', () => ({
  REALTIME_STATS_DEBOUNCE_MS: 100,
}));

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: mocks.mockSubscribe,
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => mockChannel,
    removeChannel: mocks.mockRemoveChannel,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('useRealtimeResponses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return isConnected false initially', () => {
    const { result } = renderHook(() => useRealtimeResponses('survey-1'));

    expect(result.current.isConnected).toBe(false);
  });

  it('should subscribe to two postgres_changes channels', () => {
    renderHook(() => useRealtimeResponses('survey-1'));

    expect(mockChannel.on).toHaveBeenCalledTimes(2);

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'survey_responses', filter: 'survey_id=eq.survey-1' }),
      expect.any(Function)
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'surveys', filter: 'id=eq.survey-1' }),
      expect.any(Function)
    );

    expect(mocks.mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('should set isConnected to true when channel status is SUBSCRIBED', () => {
    mocks.mockSubscribe.mockImplementation((cb: (status: string) => void) => {
      cb('SUBSCRIBED');
    });

    const { result } = renderHook(() => useRealtimeResponses('survey-1'));

    expect(result.current.isConnected).toBe(true);
  });

  it('should set isConnected to false when channel status is not SUBSCRIBED', () => {
    mocks.mockSubscribe.mockImplementation((cb: (status: string) => void) => {
      cb('CLOSED');
    });

    const { result } = renderHook(() => useRealtimeResponses('survey-1'));

    expect(result.current.isConnected).toBe(false);
  });

  it('should call router.refresh after debounce when a change comes in', () => {
    let changeCallback: () => void = () => {};

    mockChannel.on.mockImplementation((_event: string, _filter: unknown, cb: () => void) => {
      changeCallback = cb;

      return mockChannel;
    });

    renderHook(() => useRealtimeResponses('survey-1'));

    act(() => {
      changeCallback();
    });

    expect(mocks.mockRefresh).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mocks.mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should call onSync callback after debounce', () => {
    const onSync = vi.fn();
    let changeCallback: () => void = () => {};

    mockChannel.on.mockImplementation((_event: string, _filter: unknown, cb: () => void) => {
      changeCallback = cb;

      return mockChannel;
    });

    renderHook(() => useRealtimeResponses('survey-1', onSync));

    act(() => {
      changeCallback();
      vi.advanceTimersByTime(100);
    });

    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('should debounce multiple rapid changes into a single refresh', () => {
    let changeCallback: () => void = () => {};

    mockChannel.on.mockImplementation((_event: string, _filter: unknown, cb: () => void) => {
      changeCallback = cb;

      return mockChannel;
    });

    renderHook(() => useRealtimeResponses('survey-1'));

    act(() => {
      changeCallback();
      vi.advanceTimersByTime(50);
      changeCallback();
      vi.advanceTimersByTime(50);
      changeCallback();
      vi.advanceTimersByTime(100);
    });

    expect(mocks.mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should not subscribe when enabled is false', () => {
    const { result } = renderHook(() => useRealtimeResponses('survey-1', undefined, false));

    expect(mockChannel.on).not.toHaveBeenCalled();
    expect(mocks.mockSubscribe).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('should remove channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeResponses('survey-1'));

    unmount();

    expect(mocks.mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
