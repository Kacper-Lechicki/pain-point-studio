import { useCallback, useEffect, useRef, useState } from 'react';

import { SAVE_STATUS_FEEDBACK_MS } from '@/features/projects/config';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface UseInlineEditOptions<T extends HTMLElement> {
  /** Current persisted value (used to reset on cancel and detect no-change). */
  currentValue: string;
  /** Called after a successful save with the trimmed value. */
  onSaved?: (trimmed: string) => void;
  /** Async function that persists the value. Return `true` on error. */
  persist: (trimmed: string) => Promise<boolean | undefined>;
  /** Ref type for auto-focus. */
  ref?: React.RefObject<T | null>;
}

export function useInlineEdit<T extends HTMLElement = HTMLInputElement>({
  currentValue,
  onSaved,
  persist,
}: UseInlineEditOptions<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const inputRef = useRef<T>(null);

  useEffect(() => {
    if (isEditing) {
      const el = inputRef.current;

      if (el && 'focus' in el) {
        (el as unknown as HTMLInputElement).focus();
        (el as unknown as HTMLInputElement).select();
      }
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setDraft(currentValue);
    setIsEditing(true);
  }, [currentValue]);

  const cancel = useCallback(() => {
    setDraft(currentValue);
    setIsEditing(false);
    setSaveStatus('idle');
  }, [currentValue]);

  const save = useCallback(async () => {
    const trimmed = draft.trim();

    if (trimmed === currentValue || (!trimmed && !currentValue)) {
      setIsEditing(false);

      return;
    }

    setSaveStatus('saving');
    const hasError = await persist(trimmed);

    if (hasError) {
      setSaveStatus('failed');

      return;
    }

    setSaveStatus('saved');
    setIsEditing(false);
    onSaved?.(trimmed);
    setTimeout(() => setSaveStatus('idle'), SAVE_STATUS_FEEDBACK_MS);
  }, [draft, currentValue, persist, onSaved]);

  return {
    isEditing,
    draft,
    setDraft,
    saveStatus,
    inputRef,
    startEditing,
    cancel,
    save,
  } as const;
}
