'use client';

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

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
import { useRouter } from '@/i18n/routing';

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

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const t = useTranslations();
  const router = useRouter();
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const hasUnsavedChanges = dirtyIds.size > 0;

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
      e.stopPropagation();

      const href = anchor.getAttribute('href');

      if (href) {
        setPending({ type: 'href', href });
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges]);

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

    const pathname = toPathnameForRouter(pending.href);

    router.push(pathname as Parameters<typeof router.push>[0]);
    setPending(null);
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
