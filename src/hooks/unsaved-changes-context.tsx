'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { locales } from '@/i18n/constants';
import { usePathname, useRouter } from '@/i18n/routing';

type PendingNavigation = { type: 'href'; href: string };

interface UnsavedChangesContextValue {
  register: (id: string, dirty: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

function isInternalLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href');

  if (!href || href.startsWith('#')) {
    return false;
  }

  if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
    return false;
  }

  try {
    if (href.startsWith('http')) {
      return new URL(href).origin === window.location.origin;
    }

    return href.startsWith('/');
  } catch {
    return false;
  }
}

const LOCALE_LIST: readonly string[] = locales;

function toPathnameForRouter(href: string): string {
  const path = href.startsWith('http') ? new URL(href).pathname : href;
  const parts = path.split('/').filter(Boolean);
  const segment = parts[0];

  if (segment && LOCALE_LIST.includes(segment)) {
    return '/' + parts.slice(1).join('/');
  }

  return path || '/';
}

function getCurrentUrl(): string {
  return window.location.pathname + window.location.search + window.location.hash;
}

// ── Module-level pushState / replaceState patch ─────────────────────
// Installed once at import time (like back-button.tsx).
//
// Strategy: let-then-revert.  We always let pushState/replaceState
// through so Next.js can finish its React render + commit.  Then on
// the next microtask we call router.push() back to the original page
// so that React *also* reverts its rendered content (just pushing the
// URL back via history.pushState is not enough — Next.js drives
// rendering via React state, not the URL).

interface HistoryGuardState {
  /** When true, any URL-changing pushState/replaceState triggers revert. */
  active: boolean;
  /** The full URL (with locale prefix) for history.pushState. */
  currentUrl: string;
  /** The locale-stripped pathname for router.push. */
  currentPathname: string;
  /** Called with the target href; uses router.push to revert React. */
  onBlock: ((targetHref: string) => void) | null;
  /** When true the call is our own revert / confirm — let it through. */
  skip: boolean;
}

const historyGuard: HistoryGuardState = {
  active: false,
  currentUrl: '/',
  currentPathname: '/',
  onBlock: null,
  skip: false,
};

if (typeof window !== 'undefined') {
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  function afterGuard(
    original: typeof window.history.pushState,
    data: unknown,
    unused: string,
    url?: string | URL | null
  ) {
    // Capture the URL before letting the call through, since
    // original() will update window.location immediately.
    const urlBeforeCall = getCurrentUrl();

    // Always let the call through first.
    original(data, unused, url);

    if (!historyGuard.active || historyGuard.skip) {
      return;
    }

    if (!url) {
      return;
    }

    const targetHref = typeof url === 'string' ? url : url.toString();

    // If the URL didn't actually change, nothing to guard.
    if (targetHref === urlBeforeCall) {
      return;
    }

    // URL changed — notify the provider on the next microtask so
    // React's commit phase (useInsertionEffect) finishes first.
    const blockedHref = targetHref;

    queueMicrotask(() => {
      historyGuard.onBlock?.(blockedHref);
    });
  }

  window.history.pushState = function (data: unknown, unused: string, url?: string | URL | null) {
    afterGuard(originalPushState, data, unused, url);
  };

  window.history.replaceState = function (
    data: unknown,
    unused: string,
    url?: string | URL | null
  ) {
    afterGuard(originalReplaceState, data, unused, url);
  };

  // ── Module-level popstate listener ──────────────────────────────────
  // Registered at import time so it fires BEFORE Next.js's own popstate
  // handler (which dispatches ACTION_RESTORE and renders the previous
  // page).  When the guard is active, we stop the event from reaching
  // Next.js's handler and push the original URL back.
  window.addEventListener(
    'popstate',
    (e: PopStateEvent) => {
      if (!historyGuard.active || historyGuard.skip) {
        return;
      }

      const targetHref = getCurrentUrl();
      const currentPathname = historyGuard.currentPathname;

      if (toPathnameForRouter(targetHref) === currentPathname) {
        return;
      }

      // Stop Next.js's popstate handler from processing the event.
      e.stopImmediatePropagation();

      // Push the original URL back so the address bar reverts.
      // We use the raw originalPushState here (not router.push) because
      // we only need to fix the URL bar — React hasn't re-rendered yet
      // since we blocked Next.js's handler.
      historyGuard.skip = true;
      originalPushState(null, '', historyGuard.currentUrl);
      historyGuard.skip = false;

      historyGuard.onBlock?.(targetHref);
    },
    true // capture phase — fires before bubble-phase listeners
  );
}

// ── Provider ────────────────────────────────────────────────────────

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const hasUnsavedChanges = dirtyIds.size > 0;

  // Ref to the router so the module-level guard callback can use
  // router.push() without stale closure issues.
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const register = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);

      if (dirty) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }, []);

  // ── Activate / deactivate the module-level history guard ────────────
  useEffect(() => {
    historyGuard.active = hasUnsavedChanges;
    historyGuard.currentUrl = getCurrentUrl();
    historyGuard.currentPathname = toPathnameForRouter(getCurrentUrl());
    historyGuard.onBlock = hasUnsavedChanges
      ? (targetHref: string) => {
          // Use router.push to navigate React back to the original page.
          // Just pushing the URL via history.pushState is not enough —
          // Next.js drives rendering via React state, not the URL bar.
          const revertTo = historyGuard.currentPathname;

          historyGuard.skip = true;
          routerRef.current.push(revertTo as Parameters<typeof router.push>[0]);
          historyGuard.skip = false;

          setPending({ type: 'href', href: targetHref });
        }
      : null;

    return () => {
      historyGuard.active = false;
      historyGuard.onBlock = null;
    };
  }, [hasUnsavedChanges, router]);

  // Keep the guard's URLs in sync with successful navigations.
  useEffect(() => {
    historyGuard.currentUrl = getCurrentUrl();
    historyGuard.currentPathname = toPathnameForRouter(getCurrentUrl());
  }, [pathname]);

  // ── Internal link click interception ────────────────────────────────
  // Capture-phase handler intercepts <a> clicks before React/Next.js
  // can process them.  Uses stopImmediatePropagation so that React's
  // root-level delegated handler never fires.
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const anchor = (target as Element).closest?.('a') as HTMLAnchorElement | null;

      if (!anchor || !isInternalLink(anchor)) {
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      const href = anchor.getAttribute('href');

      if (href) {
        setPending({ type: 'href', href });
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges]);

  // ── beforeunload (tab close, refresh, external URL) ─────────────────
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const open = pending !== null;

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      setPending(null);
    }
  }, []);

  const handleConfirmLeave = useCallback(() => {
    if (!pending) {
      return;
    }

    // Clear dirty state so the guard deactivates before router.push fires.
    setDirtyIds(new Set());

    const targetPathname = toPathnameForRouter(pending.href);

    setPending(null);

    // Defer so the setDirtyIds flush disables the guard before router.push
    // triggers pushState internally.
    setTimeout(() => {
      router.push(targetPathname as Parameters<typeof router.push>[0]);
    }, 0);
  }, [pending, router]);

  return (
    <UnsavedChangesContext.Provider value={{ register }}>
      {children}
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.unsavedChanges.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.unsavedChanges.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.unsavedChanges.cancel')}</AlertDialogCancel>

            <AlertDialogAction variant="destructive" onClick={handleConfirmLeave}>
              {t('common.unsavedChanges.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}

function useUnsavedChangesContext(): UnsavedChangesContextValue {
  const ctx = useContext(UnsavedChangesContext);

  if (!ctx) {
    return { register: () => {} };
  }

  return ctx;
}

function useUnsavedChangesWarning(id: string, isDirty: boolean): void {
  const { register } = useUnsavedChangesContext();

  useEffect(() => {
    register(id, isDirty);

    return () => register(id, false);
  }, [id, isDirty, register]);
}

export { UnsavedChangesProvider, useUnsavedChangesContext, useUnsavedChangesWarning };
