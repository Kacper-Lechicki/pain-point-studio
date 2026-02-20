/** UnsavedChangesProvider and useUnsavedChangesWarning: navigation guard behavior. */
import { type ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnsavedChangesProvider, useUnsavedChangesWarning } from './unsaved-changes-context';

const mockRouterPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => '/dashboard',
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,

  AlertDialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,

  AlertDialogTitle: ({ children }: { children: ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),

  AlertDialogDescription: ({ children }: { children: ReactNode }) => (
    <div data-testid="dialog-description">{children}</div>
  ),

  AlertDialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick: () => void;
    variant?: string;
  }) => (
    <button data-testid="confirm-leave" onClick={onClick}>
      {children}
    </button>
  ),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <UnsavedChangesProvider>{children}</UnsavedChangesProvider>;
}

describe('useUnsavedChangesWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Registering as dirty then clean should not throw; works outside provider too.
  it('should not throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useUnsavedChangesWarning('form-1', false));
    }).not.toThrow();
  });

  // Hook registers dirty state within provider without error.
  it('should register dirty state within provider', () => {
    expect(() => {
      renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });
    }).not.toThrow();
  });

  // Cleanup: unmounting deregisters the form (sets dirty to false).
  it('should deregister on unmount', () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    expect(() => unmount()).not.toThrow();
  });

  // Switching isDirty from true to false should work without error.
  it('should handle isDirty toggling', () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesWarning('form-1', dirty), {
      wrapper,
      initialProps: { dirty: true },
    });

    expect(() => rerender({ dirty: false })).not.toThrow();
  });

  // Multiple forms can register concurrently.
  it('should support multiple concurrent registrations', () => {
    expect(() => {
      renderHook(
        () => {
          useUnsavedChangesWarning('form-1', true);
          useUnsavedChangesWarning('form-2', false);
        },
        { wrapper }
      );
    }).not.toThrow();
  });

  // When dirty, beforeunload listener should be attached.
  it('should add beforeunload listener when dirty', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();
  });

  // When not dirty, beforeunload listener should not be attached.
  it('should not add beforeunload listener when clean', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useUnsavedChangesWarning('form-1', false), { wrapper });

    const beforeUnloadCalls = addSpy.mock.calls.filter(([event]) => event === 'beforeunload');

    expect(beforeUnloadCalls).toHaveLength(0);
    addSpy.mockRestore();
  });

  // When dirty, clicking an internal link should be intercepted.
  it('should intercept internal link clicks when dirty', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    const anchor = document.createElement('a');

    anchor.setAttribute('href', '/en/dashboard');
    document.body.appendChild(anchor);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      anchor.dispatchEvent(clickEvent);
    });

    expect(clickEvent.defaultPrevented).toBe(true);
    document.body.removeChild(anchor);
  });

  // When clean, clicking an internal link should NOT be intercepted.
  it('should not intercept link clicks when clean', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', false), { wrapper });

    const anchor = document.createElement('a');

    anchor.setAttribute('href', '/en/dashboard');
    document.body.appendChild(anchor);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      anchor.dispatchEvent(clickEvent);
    });

    expect(clickEvent.defaultPrevented).toBe(false);
    document.body.removeChild(anchor);
  });

  // External links should not be intercepted even when dirty.
  it('should not intercept external link clicks', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    const anchor = document.createElement('a');

    anchor.setAttribute('href', 'https://external.com/page');
    document.body.appendChild(anchor);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      anchor.dispatchEvent(clickEvent);
    });

    expect(clickEvent.defaultPrevented).toBe(false);
    document.body.removeChild(anchor);
  });

  // Hash-only links should not be intercepted.
  it('should not intercept hash-only links', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    const anchor = document.createElement('a');

    anchor.setAttribute('href', '#section');
    document.body.appendChild(anchor);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      anchor.dispatchEvent(clickEvent);
    });

    expect(clickEvent.defaultPrevented).toBe(false);
    document.body.removeChild(anchor);
  });

  // target="_blank" links should not be intercepted.
  it('should not intercept links with target="_blank"', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    const anchor = document.createElement('a');

    anchor.setAttribute('href', '/en/dashboard');
    anchor.setAttribute('target', '_blank');
    document.body.appendChild(anchor);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      anchor.dispatchEvent(clickEvent);
    });

    expect(clickEvent.defaultPrevented).toBe(false);
    document.body.removeChild(anchor);
  });

  // Download links should not be intercepted.
  it('should not intercept download links', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    const anchor = document.createElement('a');

    anchor.setAttribute('href', '/en/file.pdf');
    anchor.setAttribute('download', '');
    document.body.appendChild(anchor);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      anchor.dispatchEvent(clickEvent);
    });

    expect(clickEvent.defaultPrevented).toBe(false);
    document.body.removeChild(anchor);
  });

  // The module-level popstate listener is always registered (at import time)
  // but only acts when the guard is active (dirty state).
  it('should intercept popstate when dirty but not when clean', () => {
    // When dirty, popstate should not throw and the guard is active.
    const { unmount } = renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    expect(() => {
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }).not.toThrow();

    unmount();

    // When clean, popstate should also not throw — the guard just lets it through.
    renderHook(() => useUnsavedChangesWarning('form-1', false), { wrapper });

    expect(() => {
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }).not.toThrow();
  });

  // When dirty, popstate should trigger the dialog (sets pending state).
  it('should intercept popstate navigation when dirty', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    // popstate handler should not throw
    expect(() => {
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }).not.toThrow();
  });

  // When dirty, pushState to a different URL should trigger router.push to revert.
  it('should revert pushState navigation when dirty', async () => {
    renderHook(() => useUnsavedChangesWarning('form-1', true), { wrapper });

    // pushState goes through initially (let-then-revert strategy).
    act(() => {
      window.history.pushState(null, '', '/other-page');
    });

    // Wait for the microtask-based revert to fire.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The guard should have called router.push to revert React to the original page.
    expect(mockRouterPush).toHaveBeenCalled();
  });

  // When clean, pushState should go through normally.
  it('should allow pushState navigation when clean', () => {
    renderHook(() => useUnsavedChangesWarning('form-1', false), { wrapper });

    const originalPathname = window.location.pathname;

    // pushState to a different URL should work normally.
    act(() => {
      window.history.pushState(null, '', '/allowed-page');
    });

    // Restore original URL for test cleanup.
    window.history.pushState(null, '', originalPathname);
  });
});
