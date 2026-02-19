/** Tests for the Supabase RealtimeProvider implementation (browser-side). */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBrowserRealtimeProvider } from './realtime';

// ── Mock browser Supabase client ─────────────────────────────────

const mockSubscribe = vi.fn();
const mockRemoveChannel = vi.fn();
const mockOn = vi.fn();

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
};

// .on() returns the channel for chaining
mockOn.mockReturnValue(mockChannel);

vi.mock('../client', () => ({
  createClient: () => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  }),
}));

describe('createBrowserRealtimeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOn.mockReturnValue(mockChannel);
  });

  it('should call channel.on for each config and subscribe', () => {
    const callback = vi.fn();

    const provider = createBrowserRealtimeProvider();
    provider.subscribe(
      'test-channel',
      [
        { event: 'INSERT', table: 'surveys' },
        { event: 'UPDATE', table: 'surveys', filter: 'user_id=eq.u-1' },
      ],
      callback
    );

    // .on() called once per config
    expect(mockOn).toHaveBeenCalledTimes(2);
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('should use default schema "public" when not specified', () => {
    const provider = createBrowserRealtimeProvider();
    provider.subscribe('ch', [{ event: '*', table: 'profiles' }], vi.fn());

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ schema: 'public', table: 'profiles', event: '*' }),
      expect.any(Function)
    );
  });

  it('should pass custom schema when specified', () => {
    const provider = createBrowserRealtimeProvider();
    provider.subscribe('ch', [{ event: 'INSERT', table: 'logs', schema: 'analytics' }], vi.fn());

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ schema: 'analytics', table: 'logs' }),
      expect.any(Function)
    );
  });

  it('should pass filter when specified in config', () => {
    const provider = createBrowserRealtimeProvider();
    provider.subscribe('ch', [{ event: 'UPDATE', table: 'surveys', filter: 'id=eq.s-1' }], vi.fn());

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ filter: 'id=eq.s-1' }),
      expect.any(Function)
    );
  });

  it('should map status and call onStatus callback', () => {
    // Capture the subscribe callback
    let subscribeCb: (status: string) => void = () => {};

    mockSubscribe.mockImplementation((cb: (status: string) => void) => {
      subscribeCb = cb;
    });

    const onStatus = vi.fn();
    const provider = createBrowserRealtimeProvider();
    provider.subscribe('ch', [{ event: '*', table: 't' }], vi.fn(), onStatus);

    // Simulate status changes
    subscribeCb('SUBSCRIBED');
    expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED');

    subscribeCb('CLOSED');
    expect(onStatus).toHaveBeenCalledWith('CLOSED');

    subscribeCb('TIMED_OUT');
    expect(onStatus).toHaveBeenCalledWith('CHANNEL_ERROR');
  });

  it('should return a channel with unsubscribe that calls removeChannel', () => {
    const provider = createBrowserRealtimeProvider();
    const channel = provider.subscribe('ch', [{ event: '*', table: 't' }], vi.fn());

    channel.unsubscribe();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
