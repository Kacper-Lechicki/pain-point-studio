// @vitest-environment jsdom
/** useRealtimeSurveyList: Supabase Realtime subscription for dashboard survey list. */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRealtimeSurveyList } from './use-realtime-survey-list';

// ── Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockSubscribe: vi.fn(),
  mockRemoveChannel: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.mockRefresh }),
}));

vi.mock('@/config/realtime', () => ({
  REALTIME_DEBOUNCE_MS: 100,
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

describe('useRealtimeSurveyList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return isConnected false initially', () => {
    const { result } = renderHook(() => useRealtimeSurveyList());
    expect(result.current.isConnected).toBe(false);
  });

  it('should subscribe to survey_responses and surveys channels', () => {
    renderHook(() => useRealtimeSurveyList());

    expect(mockChannel.on).toHaveBeenCalledTimes(2);

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', table: 'survey_responses' }),
      expect.any(Function)
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: 'UPDATE', table: 'surveys' }),
      expect.any(Function)
    );

    expect(mocks.mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('should set isConnected to true when channel status is SUBSCRIBED', () => {
    mocks.mockSubscribe.mockImplementation((cb: (status: string) => void) => {
      cb('SUBSCRIBED');
    });

    const { result } = renderHook(() => useRealtimeSurveyList());

    expect(result.current.isConnected).toBe(true);
  });

  it('should call router.refresh after debounce on change', () => {
    let changeCallback: () => void = () => {};

    mockChannel.on.mockImplementation((_event: string, _filter: unknown, cb: () => void) => {
      changeCallback = cb;

      return mockChannel;
    });

    renderHook(() => useRealtimeSurveyList());

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

    renderHook(() => useRealtimeSurveyList(onSync));

    act(() => {
      changeCallback();
      vi.advanceTimersByTime(100);
    });

    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('should not subscribe when enabled is false', () => {
    const { result } = renderHook(() => useRealtimeSurveyList(undefined, false));

    expect(mockChannel.on).not.toHaveBeenCalled();
    expect(mocks.mockSubscribe).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('should remove channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeSurveyList());

    unmount();

    expect(mocks.mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
