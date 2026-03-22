'use client';

import { useEffect, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';

import { updateProjectNote } from '@/features/projects/actions/update-project-note';
import { extractTitleFromTiptap } from '@/features/projects/lib/note-helpers';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed';

const SAVE_DELAY_MS = 300;

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
  const [trackedNoteId, setTrackedNoteId] = useState(noteId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const noteIdRef = useRef(noteId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveCounterRef = useRef(0);

  if (noteId !== trackedNoteId) {
    setTrackedNoteId(noteId);
    setSaveStatus('idle');
  }

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [noteId]);

  const save = async (json: JSONContent, targetNoteId: string, saveId: number) => {
    setSaveStatus('saving');

    const title = extractTitleFromTiptap(json);
    onTitleExtracted?.(targetNoteId, title);

    const result = await updateProjectNote({
      noteId: targetNoteId,
      content: json,
    });

    if (noteIdRef.current !== targetNoteId || saveCounterRef.current !== saveId) {
      return;
    }

    setSaveStatus(result.success ? 'saved' : 'failed');
  };

  const handleContentChange = (json: JSONContent) => {
    const targetNoteId = noteIdRef.current;

    if (!targetNoteId) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const saveId = ++saveCounterRef.current;

    setSaveStatus('pending');
    timerRef.current = setTimeout(() => void save(json, targetNoteId, saveId), SAVE_DELAY_MS);
  };

  return { saveStatus, handleContentChange };
}
