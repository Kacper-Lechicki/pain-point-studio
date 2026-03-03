// @vitest-environment jsdom
/** useFormAction hook: loading state, toast notifications, and error handling. */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActionResult } from '@/lib/common/types';

import { useFormAction } from './use-form-action';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockRouterReplace = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ replace: mockRouterReplace, refresh: mockRouterRefresh }),
}));

describe('useFormAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Initial state: isLoading is false before any execution.
  it('should start with isLoading false', () => {
    const { result } = renderHook(() => useFormAction());

    expect(result.current.isLoading).toBe(false);
  });

  // isLoading becomes true while action is in flight, then false after resolve.
  it('should set isLoading true during execution', async () => {
    let resolveAction: (value: ActionResult) => void;

    const action = () =>
      new Promise<ActionResult>((resolve) => {
        resolveAction = resolve;
      });

    const { result } = renderHook(() => useFormAction());

    let executePromise: Promise<ActionResult>;

    act(() => {
      executePromise = result.current.execute(action, {});
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveAction!({ success: true });
      await executePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  // On success: success toast with successMessage and onSuccess callback are invoked.
  it('should show success toast and call onSuccess when action succeeds', async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useFormAction({
        successMessage: 'settings.saved' as never,
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.execute(action, { name: 'test' });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('settings.saved');
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  // When successMessage is omitted, no success toast is shown on success.
  it('should not show success toast when successMessage is not provided', async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFormAction());

    await act(async () => {
      await result.current.execute(action, {});
    });

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  // When action returns error: error toast with that key and onError are invoked.
  it('should show error toast and call onError when action returns error', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'settings.errors.invalidData' });
    const onError = vi.fn();
    const { result } = renderHook(() => useFormAction({ onError }));

    await act(async () => {
      await result.current.execute(action, {});
    });

    expect(mockToastError).toHaveBeenCalledWith('settings.errors.invalidData');
    expect(onError).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  // When action throws: unexpected error toast (default key) is shown.
  it('should show unexpected error toast when action throws', async () => {
    const action = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useFormAction());

    await act(async () => {
      await result.current.execute(action, {});
    });

    expect(mockToastError).toHaveBeenCalledWith('common.errors.unexpected');
    expect(result.current.isLoading).toBe(false);
  });

  // unexpectedErrorMessage option overrides default toast key when action throws.
  it('should use custom unexpectedErrorMessage when action throws', async () => {
    const action = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      useFormAction({ unexpectedErrorMessage: 'settings.errors.unexpected' as never })
    );

    await act(async () => {
      await result.current.execute(action, {});
    });

    expect(mockToastError).toHaveBeenCalledWith('settings.errors.unexpected');
  });

  // execute resolves to the action result object on success.
  it('should return the action result on success', async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFormAction());

    let actionResult: ActionResult | undefined;

    await act(async () => {
      actionResult = await result.current.execute(action, {});
    });

    expect(actionResult).toEqual({ success: true });
  });

  // execute resolves to { error } when action returns error.
  it('should return error result on action error', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'some.error' });
    const { result } = renderHook(() => useFormAction());

    let actionResult: ActionResult | undefined;

    await act(async () => {
      actionResult = await result.current.execute(action, {});
    });

    expect(actionResult).toEqual({ error: 'some.error' });
  });

  // execute resolves to { error: unexpectedErrorMessage } when action throws.
  it('should return error result when action throws', async () => {
    const action = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useFormAction());

    let actionResult: ActionResult | undefined;

    await act(async () => {
      actionResult = await result.current.execute(action, {});
    });

    expect(actionResult).toEqual({ error: 'common.errors.unexpected' });
  });

  // onError callback is invoked when action throws.
  it('should call onError when action throws', async () => {
    const action = vi.fn().mockRejectedValue(new Error('fail'));
    const onError = vi.fn();
    const { result } = renderHook(() => useFormAction({ onError }));

    await act(async () => {
      await result.current.execute(action, {});
    });

    expect(onError).toHaveBeenCalled();
  });

  // When action returns authRequired error: redirects to sign-in via router.
  it('should redirect to sign-in when action returns authRequired error', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'common.errors.authRequired' });
    const onError = vi.fn();
    const { result } = renderHook(() => useFormAction({ onError }));

    await act(async () => {
      await result.current.execute(action, {});
    });

    expect(mockToastError).toHaveBeenCalledWith('common.errors.authRequired');
    expect(mockRouterReplace).toHaveBeenCalledWith('/sign-in');
    expect(mockRouterRefresh).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  // Second argument of execute is passed through to the action function.
  it('should pass data to the action function', async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFormAction());

    await act(async () => {
      await result.current.execute(action, { email: 'test@example.com' });
    });

    expect(action).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
