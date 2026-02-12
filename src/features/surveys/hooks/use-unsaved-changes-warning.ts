import { useEffect } from 'react';

/**
 * Shows a native browser "unsaved changes" dialog when the user tries to
 * close or navigate away from the tab while `isDirty` is `true`.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) {return;}

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
