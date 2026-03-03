'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';

import { createNoteFolder } from '@/features/projects/actions/create-note-folder';
import { createProjectNote } from '@/features/projects/actions/create-project-note';
import { deleteNoteFolder } from '@/features/projects/actions/delete-note-folder';
import { deleteProjectNote } from '@/features/projects/actions/delete-project-note';
import { duplicateProjectNote } from '@/features/projects/actions/duplicate-project-note';
import { emptyTrash } from '@/features/projects/actions/empty-trash';
import { getProjectNote } from '@/features/projects/actions/get-project-note';
import { moveNoteToFolder } from '@/features/projects/actions/move-note-to-folder';
import { permanentlyDeleteProjectNote } from '@/features/projects/actions/permanently-delete-note';
import { reorderNoteFolders } from '@/features/projects/actions/reorder-note-folders';
import { reorderProjectNotes } from '@/features/projects/actions/reorder-project-notes';
import { restoreProjectNote } from '@/features/projects/actions/restore-project-note';
import { togglePinProjectNote } from '@/features/projects/actions/toggle-pin-note';
import { updateNoteFolder } from '@/features/projects/actions/update-note-folder';
import { NOTE_TITLE_MAX_LENGTH } from '@/features/projects/config';
import type { ProjectNoteFolder, ProjectNoteMeta } from '@/features/projects/types';
import { useSessionState } from '@/hooks/common/use-session-state';

interface UseNotesStateOptions {
  projectId: string;
  initialNotes: ProjectNoteMeta[];
  initialFolders: ProjectNoteFolder[];
}

export function useNotesState({ projectId, initialNotes, initialFolders }: UseNotesStateOptions) {
  const [notes, setNotes] = useState(initialNotes);
  const [folders, setFolders] = useState(initialFolders);
  const [selectedNoteId, setSelectedNoteId] = useSessionState<string | null>(
    `notes-selected-${projectId}`,
    null
  );
  const [expandedFolderIds, setExpandedFolderIds] = useSessionState<string[]>(
    `notes-expanded-${projectId}`,
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [noteContent, setNoteContent] = useState<JSONContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const contentCacheRef = useRef<Map<string, JSONContent>>(new Map());

  // Sync with server data when it changes (e.g., after revalidation)
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  // Lazy-load content when selected note changes
  useEffect(() => {
    if (!selectedNoteId) {
      setNoteContent(null);

      return;
    }

    // Check cache first
    const cached = contentCacheRef.current.get(selectedNoteId);

    if (cached) {
      setNoteContent(cached);

      return;
    }

    let cancelled = false;

    setIsLoadingContent(true);

    void getProjectNote(selectedNoteId).then((note) => {
      if (cancelled) {
        return;
      }

      setIsLoadingContent(false);

      if (note?.content_json) {
        const content = note.content_json as JSONContent;

        contentCacheRef.current.set(selectedNoteId, content);
        setNoteContent(content);
      } else {
        setNoteContent(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedNoteId]);

  // ── Derived data ──────────────────────────────────────────────────

  const activeNotes = useMemo(() => notes.filter((n) => !n.deleted_at), [notes]);

  const trashedNotes = useMemo(() => notes.filter((n) => !!n.deleted_at), [notes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeNotes;
    }

    const q = searchQuery.toLowerCase();

    return activeNotes.filter((n) => n.title.toLowerCase().includes(q));
  }, [activeNotes, searchQuery]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.is_pinned).sort((a, b) => a.sort_order - b.sort_order),
    [filteredNotes]
  );

  const unfiledNotes = useMemo(
    () =>
      filteredNotes
        .filter((n) => !n.is_pinned && !n.folder_id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [filteredNotes]
  );

  const getNotesByFolder = useCallback(
    (folderId: string) =>
      filteredNotes
        .filter((n) => !n.is_pinned && n.folder_id === folderId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [filteredNotes]
  );

  // ── Note CRUD ─────────────────────────────────────────────────────

  const handleCreateNote = useCallback(
    async (title?: string, folderId?: string | null) => {
      const result = await createProjectNote({
        projectId,
        title: title || undefined,
        folderId: folderId ?? undefined,
      });

      if (result.success && result.data) {
        const newNote: ProjectNoteMeta = {
          id: result.data.noteId,
          project_id: projectId,
          user_id: '',
          folder_id: folderId ?? null,
          title: title || 'Untitled',
          is_pinned: false,
          sort_order: 0,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setNotes((prev) => [newNote, ...prev]);
        setSelectedNoteId(result.data.noteId);
        setNoteContent(null);

        return result.data.noteId;
      }

      return null;
    },
    [projectId, setSelectedNoteId]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      // Optimistic: mark as deleted
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, deleted_at: new Date().toISOString() } : n))
      );

      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }

      const result = await deleteProjectNote({ noteId });

      if (!result.success) {
        // Rollback
        setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, deleted_at: null } : n)));
      }
    },
    [selectedNoteId, setSelectedNoteId]
  );

  const handleRestoreNote = useCallback(async (noteId: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, deleted_at: null } : n)));

    const result = await restoreProjectNote({ noteId });

    if (!result.success) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, deleted_at: new Date().toISOString() } : n))
      );
    }
  }, []);

  const handlePermanentlyDelete = useCallback(
    async (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }

      contentCacheRef.current.delete(noteId);

      await permanentlyDeleteProjectNote({ noteId });
    },
    [selectedNoteId, setSelectedNoteId]
  );

  const handleEmptyTrash = useCallback(async () => {
    const trashedIds = trashedNotes.map((n) => n.id);

    setNotes((prev) => prev.filter((n) => !n.deleted_at));

    if (selectedNoteId && trashedIds.includes(selectedNoteId)) {
      setSelectedNoteId(null);
    }

    trashedIds.forEach((id) => contentCacheRef.current.delete(id));

    await emptyTrash({ projectId });
  }, [trashedNotes, projectId, selectedNoteId, setSelectedNoteId]);

  const handleDuplicateNote = useCallback(
    async (noteId: string) => {
      const result = await duplicateProjectNote({ noteId });

      if (result.success && result.data) {
        const original = notes.find((n) => n.id === noteId);

        if (original) {
          const copy: ProjectNoteMeta = {
            ...original,
            id: result.data.noteId,
            title: `Copy of ${original.title}`.slice(0, NOTE_TITLE_MAX_LENGTH),
            is_pinned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setNotes((prev) => [copy, ...prev]);
          setSelectedNoteId(result.data.noteId);

          // Copy cached content if available
          const cachedContent = contentCacheRef.current.get(noteId);

          if (cachedContent) {
            contentCacheRef.current.set(result.data.noteId, cachedContent);
            setNoteContent(cachedContent);
          } else {
            setNoteContent(null);
          }
        }
      }
    },
    [notes, setSelectedNoteId]
  );

  const handleTogglePin = useCallback(async (noteId: string, isPinned: boolean) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_pinned: isPinned } : n)));

    const result = await togglePinProjectNote({ noteId, isPinned });

    if (!result.success) {
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_pinned: !isPinned } : n)));
    }
  }, []);

  const handleMoveToFolder = useCallback(async (noteId: string, folderId: string | null) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, folder_id: folderId } : n)));

    const result = await moveNoteToFolder({ noteId, folderId });

    if (!result.success) {
      // Rollback is complex since we don't know the old folder_id easily
      // For now, accept the optimistic update
    }
  }, []);

  const handleReorderNotes = useCallback(async (noteIds: string[]) => {
    // Optimistic update
    setNotes((prev) => {
      const updated = [...prev];

      noteIds.forEach((id, index) => {
        const noteIndex = updated.findIndex((n) => n.id === id);

        if (noteIndex !== -1) {
          updated[noteIndex] = { ...updated[noteIndex]!, sort_order: index };
        }
      });

      return updated;
    });

    await reorderProjectNotes({ noteIds });
  }, []);

  // Title update from auto-save
  const handleTitleExtracted = useCallback((noteId: string, title: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, title } : n)));
  }, []);

  // Update content cache when auto-save triggers
  const handleContentChange = useCallback(
    (json: JSONContent) => {
      if (selectedNoteId) {
        contentCacheRef.current.set(selectedNoteId, json);
        setNoteContent(json);
      }
    },
    [selectedNoteId]
  );

  // ── Folder CRUD ───────────────────────────────────────────────────

  const handleCreateFolder = useCallback(
    async (name: string) => {
      const result = await createNoteFolder({ projectId, name });

      if (result.success && result.data) {
        const newFolder: ProjectNoteFolder = {
          id: result.data.folderId,
          project_id: projectId,
          user_id: '',
          name,
          sort_order: folders.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setFolders((prev) => [...prev, newFolder]);
        setExpandedFolderIds([...expandedFolderIds, result.data!.folderId]);

        return result.data.folderId;
      }

      return null;
    },
    [projectId, folders.length, expandedFolderIds, setExpandedFolderIds]
  );

  const handleRenameFolder = useCallback(async (folderId: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name } : f)));

    const result = await updateNoteFolder({ folderId, name });

    if (!result.success) {
      // Rollback would need old name — accept optimistic for now
    }
  }, []);

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      // Notes in folder become unfiled (DB handles via ON DELETE SET NULL)
      setNotes((prev) =>
        prev.map((n) => (n.folder_id === folderId ? { ...n, folder_id: null } : n))
      );
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setExpandedFolderIds(expandedFolderIds.filter((id) => id !== folderId));

      await deleteNoteFolder({ folderId });
    },
    [expandedFolderIds, setExpandedFolderIds]
  );

  const handleReorderFolders = useCallback(async (folderIds: string[]) => {
    setFolders((prev) => {
      const updated = [...prev];

      folderIds.forEach((id, index) => {
        const fi = updated.findIndex((f) => f.id === id);

        if (fi !== -1) {
          updated[fi] = { ...updated[fi]!, sort_order: index };
        }
      });

      return updated.sort((a, b) => a.sort_order - b.sort_order);
    });

    await reorderNoteFolders({ folderIds });
  }, []);

  const toggleFolderExpanded = useCallback(
    (folderId: string) => {
      setExpandedFolderIds(
        expandedFolderIds.includes(folderId)
          ? expandedFolderIds.filter((id) => id !== folderId)
          : [...expandedFolderIds, folderId]
      );
    },
    [expandedFolderIds, setExpandedFolderIds]
  );

  return {
    // State
    notes,
    folders: folders.sort((a, b) => a.sort_order - b.sort_order),
    selectedNoteId,
    expandedFolderIds,
    searchQuery,
    noteContent,
    isLoadingContent,

    // Derived
    activeNotes,
    trashedNotes,
    pinnedNotes,
    unfiledNotes,
    getNotesByFolder,

    // Setters
    setSelectedNoteId,
    setSearchQuery,
    setNoteContent,

    // Note actions
    handleCreateNote,
    handleDeleteNote,
    handleRestoreNote,
    handlePermanentlyDelete,
    handleEmptyTrash,
    handleDuplicateNote,
    handleTogglePin,
    handleMoveToFolder,
    handleReorderNotes,
    handleTitleExtracted,
    handleContentChange,

    // Folder actions
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleReorderFolders,
    toggleFolderExpanded,
  };
}

export type NotesState = ReturnType<typeof useNotesState>;
