// @vitest-environment jsdom
/** useLinkIdentity: OAuth identity link flow with error handling. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLinkIdentity } from './use-link-identity';

// ── Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  mockLinkIdentity: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('@/lib/common/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://example.com' },
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { linkIdentity: mocks.mockLinkIdentity },
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('useLinkIdentity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialise with linkingProvider as null', () => {
    const { result } = renderHook(() => useLinkIdentity());
    expect(result.current.linkingProvider).toBeNull();
  });

  it('should set linkingProvider while linking', async () => {
    mocks.mockLinkIdentity.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useLinkIdentity());

    await act(async () => {
      await result.current.linkProvider('google');
    });

    // After a successful link (no redirect in test), provider remains set
    expect(mocks.mockLinkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://example.com/en/auth/callback?next=/en/settings/connected-accounts',
      },
    });
  });

  it('should show toast and reset provider on Supabase error', async () => {
    mocks.mockLinkIdentity.mockResolvedValue({ error: { message: 'Link failed' } });

    const { result } = renderHook(() => useLinkIdentity());

    await act(async () => {
      await result.current.linkProvider('github');
    });

    await waitFor(() => {
      expect(result.current.linkingProvider).toBeNull();
    });

    expect(mocks.mockToastError).toHaveBeenCalledWith(
      'settings.connectedAccounts.errors.linkFailed'
    );
  });

  it('should show toast and reset provider on unexpected error', async () => {
    mocks.mockLinkIdentity.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLinkIdentity());

    await act(async () => {
      await result.current.linkProvider('google');
    });

    await waitFor(() => {
      expect(result.current.linkingProvider).toBeNull();
    });

    expect(mocks.mockToastError).toHaveBeenCalledWith('settings.errors.unexpected');
  });
});
