'use client';

import { useEffect, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';

import { updateProjectNote } from '@/features/projects/actions/update-project-note';
import { NOTE_CONTENT_DEBOUNCE_MS } from '@/features/projects/config';
import { extractTitleFromTiptap } from '@/features/projects/lib/note-helpers';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed';

interface UseNoteAutoSaveOptions {
  noteId: string | null;
  onTitleExtracted?: (noteId: string, title: string) => void;
}

interface UseNoteAutoSaveReturn {
  saveStatus: SaveStatus;
  handleContentChange: (json: JSONContent) => void;
}

export function useNoteAutoSave({
  noteId,
  onTitleExtracted,
}: UseNoteAutoSaveOptions): UseNoteAutoSaveReturn {
  // Track noteId changes to reset state
  const [trackedNoteId, setTrackedNoteId] = useState(noteId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef(noteId);

  // When noteId changes from parent, reset tracked state
  if (noteId !== trackedNoteId) {
    setTrackedNoteId(noteId);
    setSaveStatus('idle');
  }

  // Track the latest noteId for async callbacks
  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  // Clear pending timers when noteId changes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [noteId]);

  const save = async (json: JSONContent, targetNoteId: string) => {
    setSaveStatus('saving');

    // Optimistically extract title and update sidebar
    const title = extractTitleFromTiptap(json);
    onTitleExtracted?.(targetNoteId, title);

    const result = await updateProjectNote({
      noteId: targetNoteId,
      content: json,
    });

    // Only update status if we're still on the same note
    if (noteIdRef.current !== targetNoteId) {
      return;
    }

    if (result.success) {
      setSaveStatus('saved');
    } else {
      setSaveStatus('failed');
    }
  };

  const handleContentChange = (json: JSONContent) => {
    const targetNoteId = noteIdRef.current;

    if (!targetNoteId) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSaveStatus('pending');
    timerRef.current = setTimeout(() => save(json, targetNoteId), NOTE_CONTENT_DEBOUNCE_MS);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { saveStatus, handleContentChange };
}
