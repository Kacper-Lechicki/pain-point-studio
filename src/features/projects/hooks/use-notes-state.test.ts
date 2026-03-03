// @vitest-environment jsdom
import { useState } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectNoteFolder, ProjectNoteMeta } from '@/features/projects/types';

import { useNotesState } from './use-notes-state';

// ── Mock server actions ──────────────────────────────────────────────

const mockCreateProjectNote = vi.fn();
const mockDeleteProjectNote = vi.fn();
const mockRestoreProjectNote = vi.fn();
const mockPermanentlyDeleteProjectNote = vi.fn();
const mockEmptyTrash = vi.fn();
const mockDuplicateProjectNote = vi.fn();
const mockTogglePinProjectNote = vi.fn();
const mockMoveNoteToFolder = vi.fn();
const mockReorderProjectNotes = vi.fn();
const mockGetProjectNote = vi.fn();
const mockCreateNoteFolder = vi.fn();
const mockUpdateNoteFolder = vi.fn();
const mockDeleteNoteFolder = vi.fn();
const mockReorderNoteFolders = vi.fn();

vi.mock('@/features/projects/actions/create-project-note', () => ({
  createProjectNote: (...args: unknown[]) => mockCreateProjectNote(...args),
}));
vi.mock('@/features/projects/actions/delete-project-note', () => ({
  deleteProjectNote: (...args: unknown[]) => mockDeleteProjectNote(...args),
}));
vi.mock('@/features/projects/actions/restore-project-note', () => ({
  restoreProjectNote: (...args: unknown[]) => mockRestoreProjectNote(...args),
}));
vi.mock('@/features/projects/actions/permanently-delete-note', () => ({
  permanentlyDeleteProjectNote: (...args: unknown[]) => mockPermanentlyDeleteProjectNote(...args),
}));
vi.mock('@/features/projects/actions/empty-trash', () => ({
  emptyTrash: (...args: unknown[]) => mockEmptyTrash(...args),
}));
vi.mock('@/features/projects/actions/duplicate-project-note', () => ({
  duplicateProjectNote: (...args: unknown[]) => mockDuplicateProjectNote(...args),
}));
vi.mock('@/features/projects/actions/toggle-pin-note', () => ({
  togglePinProjectNote: (...args: unknown[]) => mockTogglePinProjectNote(...args),
}));
vi.mock('@/features/projects/actions/move-note-to-folder', () => ({
  moveNoteToFolder: (...args: unknown[]) => mockMoveNoteToFolder(...args),
}));
vi.mock('@/features/projects/actions/reorder-project-notes', () => ({
  reorderProjectNotes: (...args: unknown[]) => mockReorderProjectNotes(...args),
}));
vi.mock('@/features/projects/actions/get-project-note', () => ({
  getProjectNote: (...args: unknown[]) => mockGetProjectNote(...args),
}));
vi.mock('@/features/projects/actions/create-note-folder', () => ({
  createNoteFolder: (...args: unknown[]) => mockCreateNoteFolder(...args),
}));
vi.mock('@/features/projects/actions/update-note-folder', () => ({
  updateNoteFolder: (...args: unknown[]) => mockUpdateNoteFolder(...args),
}));
vi.mock('@/features/projects/actions/delete-note-folder', () => ({
  deleteNoteFolder: (...args: unknown[]) => mockDeleteNoteFolder(...args),
}));
vi.mock('@/features/projects/actions/reorder-note-folders', () => ({
  reorderNoteFolders: (...args: unknown[]) => mockReorderNoteFolders(...args),
}));
vi.mock('@/features/projects/config', () => ({
  NOTE_TITLE_MAX_LENGTH: 200,
}));
vi.mock('@/hooks/common/use-session-state', () => ({
  useSessionState: (_key: string, initial: unknown) => {
    const [state, setState] = useState(initial);

    return [state, setState];
  },
}));

// ── Factories ────────────────────────────────────────────────────────

function makeNote(overrides: Partial<ProjectNoteMeta> = {}): ProjectNoteMeta {
  return {
    id: 'n1',
    project_id: 'p1',
    user_id: 'u1',
    folder_id: null,
    title: 'Note 1',
    is_pinned: false,
    sort_order: 0,
    deleted_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

function makeFolder(overrides: Partial<ProjectNoteFolder> = {}): ProjectNoteFolder {
  return {
    id: 'f1',
    project_id: 'p1',
    user_id: 'u1',
    name: 'Folder 1',
    sort_order: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

const defaultProps = {
  projectId: 'p1',
  initialNotes: [
    makeNote({ id: 'n1', title: 'Active Note', sort_order: 0 }),
    makeNote({ id: 'n2', title: 'Pinned Note', is_pinned: true, sort_order: 1 }),
    makeNote({ id: 'n3', title: 'Trashed Note', deleted_at: '2024-06-01', sort_order: 2 }),
  ],
  initialFolders: [makeFolder({ id: 'f1', name: 'Folder 1', sort_order: 0 })],
};

describe('useNotesState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectNote.mockResolvedValue(null);
    mockDeleteProjectNote.mockResolvedValue({ success: true });
    mockRestoreProjectNote.mockResolvedValue({ success: true });
    mockTogglePinProjectNote.mockResolvedValue({ success: true });
    mockMoveNoteToFolder.mockResolvedValue({ success: true });
    mockReorderProjectNotes.mockResolvedValue({ success: true });
    mockReorderNoteFolders.mockResolvedValue({ success: true });
    mockUpdateNoteFolder.mockResolvedValue({ success: true });
    mockPermanentlyDeleteProjectNote.mockResolvedValue({ success: true });
    mockEmptyTrash.mockResolvedValue({ success: true });
  });

  // ── Derived data ─────────────────────────────────────────────────

  describe('derived data', () => {
    it('separates active and trashed notes', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      expect(result.current.activeNotes).toHaveLength(2);
      expect(result.current.trashedNotes).toHaveLength(1);
      expect(result.current.trashedNotes[0]!.id).toBe('n3');
    });

    it('returns pinned notes sorted by sort_order', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      expect(result.current.pinnedNotes).toHaveLength(1);
      expect(result.current.pinnedNotes[0]!.id).toBe('n2');
    });

    it('returns unfiled notes (not pinned, no folder)', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      expect(result.current.unfiledNotes).toHaveLength(1);
      expect(result.current.unfiledNotes[0]!.id).toBe('n1');
    });

    it('getNotesByFolder returns notes in a specific folder', () => {
      const notes = [
        makeNote({ id: 'nf1', folder_id: 'f1', sort_order: 0 }),
        makeNote({ id: 'nf2', folder_id: 'f1', sort_order: 1 }),
        makeNote({ id: 'nf3', folder_id: null, sort_order: 2 }),
      ];
      const { result } = renderHook(() => useNotesState({ ...defaultProps, initialNotes: notes }));

      const folderNotes = result.current.getNotesByFolder('f1');

      expect(folderNotes).toHaveLength(2);
      expect(folderNotes.map((n) => n.id)).toEqual(['nf1', 'nf2']);
    });

    it('filters notes by search query', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      act(() => result.current.setSearchQuery('Pinned'));

      expect(result.current.pinnedNotes).toHaveLength(1);
      expect(result.current.unfiledNotes).toHaveLength(0);
    });

    it('search is case-insensitive', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      act(() => result.current.setSearchQuery('active'));

      expect(result.current.unfiledNotes).toHaveLength(1);
      expect(result.current.unfiledNotes[0]!.id).toBe('n1');
    });
  });

  // ── Note CRUD ────────────────────────────────────────────────────

  describe('note CRUD', () => {
    it('handleCreateNote adds a new note optimistically', async () => {
      mockCreateProjectNote.mockResolvedValue({
        success: true,
        data: { noteId: 'new-note' },
      });

      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleCreateNote('New Note');
      });

      const newNote = result.current.activeNotes.find((n) => n.id === 'new-note');

      expect(newNote).toBeDefined();
      expect(newNote!.title).toBe('New Note');
      expect(result.current.selectedNoteId).toBe('new-note');
    });

    it('handleCreateNote returns null on failure', async () => {
      mockCreateProjectNote.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useNotesState(defaultProps));

      let noteId: string | null = null;

      await act(async () => {
        noteId = await result.current.handleCreateNote('Fail Note');
      });

      expect(noteId).toBeNull();
    });

    it('handleDeleteNote marks note as deleted optimistically', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleDeleteNote('n1');
      });

      expect(result.current.activeNotes.find((n) => n.id === 'n1')).toBeUndefined();
      expect(result.current.trashedNotes.find((n) => n.id === 'n1')).toBeDefined();
    });

    it('handleDeleteNote rolls back on failure', async () => {
      mockDeleteProjectNote.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleDeleteNote('n1');
      });

      await waitFor(() => {
        expect(result.current.activeNotes.find((n) => n.id === 'n1')).toBeDefined();
      });
    });

    it('handleRestoreNote removes deleted_at', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleRestoreNote('n3');
      });

      expect(result.current.activeNotes.find((n) => n.id === 'n3')).toBeDefined();
    });

    it('handlePermanentlyDelete removes note from list', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handlePermanentlyDelete('n3');
      });

      expect(result.current.notes.find((n) => n.id === 'n3')).toBeUndefined();
    });

    it('handleEmptyTrash removes all trashed notes', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleEmptyTrash();
      });

      expect(result.current.trashedNotes).toHaveLength(0);
    });

    it('handleDuplicateNote creates a copy', async () => {
      mockDuplicateProjectNote.mockResolvedValue({
        success: true,
        data: { noteId: 'dup-note' },
      });

      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleDuplicateNote('n1');
      });

      const dup = result.current.activeNotes.find((n) => n.id === 'dup-note');

      expect(dup).toBeDefined();
      expect(dup!.title).toBe('Copy of Active Note');
      expect(result.current.selectedNoteId).toBe('dup-note');
    });

    it('handleTogglePin toggles is_pinned optimistically', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleTogglePin('n1', true);
      });

      const note = result.current.notes.find((n) => n.id === 'n1');

      expect(note!.is_pinned).toBe(true);
    });

    it('handleTogglePin rolls back on failure', async () => {
      mockTogglePinProjectNote.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleTogglePin('n1', true);
      });

      await waitFor(() => {
        const note = result.current.notes.find((n) => n.id === 'n1');

        expect(note!.is_pinned).toBe(false);
      });
    });

    it('handleMoveToFolder updates folder_id', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleMoveToFolder('n1', 'f1');
      });

      const note = result.current.notes.find((n) => n.id === 'n1');

      expect(note!.folder_id).toBe('f1');
    });

    it('handleReorderNotes updates sort_order', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleReorderNotes(['n2', 'n1']);
      });

      const n1 = result.current.notes.find((n) => n.id === 'n1');
      const n2 = result.current.notes.find((n) => n.id === 'n2');

      expect(n2!.sort_order).toBe(0);
      expect(n1!.sort_order).toBe(1);
    });

    it('handleTitleExtracted updates note title', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      act(() => result.current.handleTitleExtracted('n1', 'New Title'));

      const note = result.current.notes.find((n) => n.id === 'n1');

      expect(note!.title).toBe('New Title');
    });
  });

  // ── Folder CRUD ──────────────────────────────────────────────────

  describe('folder CRUD', () => {
    it('handleCreateFolder adds a new folder', async () => {
      mockCreateNoteFolder.mockResolvedValue({
        success: true,
        data: { folderId: 'new-folder' },
      });

      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleCreateFolder('New Folder');
      });

      const folder = result.current.folders.find((f) => f.id === 'new-folder');

      expect(folder).toBeDefined();
      expect(folder!.name).toBe('New Folder');
    });

    it('handleRenameFolder updates folder name', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      await act(async () => {
        await result.current.handleRenameFolder('f1', 'Renamed');
      });

      const folder = result.current.folders.find((f) => f.id === 'f1');

      expect(folder!.name).toBe('Renamed');
    });

    it('handleDeleteFolder removes folder and unfiles its notes', async () => {
      const notesWithFolder = [
        makeNote({ id: 'nf1', folder_id: 'f1' }),
        makeNote({ id: 'nf2', folder_id: null }),
      ];

      const { result } = renderHook(() =>
        useNotesState({ ...defaultProps, initialNotes: notesWithFolder })
      );

      await act(async () => {
        await result.current.handleDeleteFolder('f1');
      });

      // Folder removed
      expect(result.current.folders.find((f) => f.id === 'f1')).toBeUndefined();

      // Note moved to unfiled
      const note = result.current.notes.find((n) => n.id === 'nf1');

      expect(note!.folder_id).toBeNull();
    });

    it('handleReorderFolders updates sort_order', async () => {
      const folders = [
        makeFolder({ id: 'f1', sort_order: 0 }),
        makeFolder({ id: 'f2', sort_order: 1 }),
      ];

      const { result } = renderHook(() =>
        useNotesState({ ...defaultProps, initialFolders: folders })
      );

      await act(async () => {
        await result.current.handleReorderFolders(['f2', 'f1']);
      });

      expect(result.current.folders[0]!.id).toBe('f2');
      expect(result.current.folders[1]!.id).toBe('f1');
    });

    it('toggleFolderExpanded toggles folder expansion', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      act(() => result.current.toggleFolderExpanded('f1'));

      expect(result.current.expandedFolderIds).toContain('f1');

      act(() => result.current.toggleFolderExpanded('f1'));

      expect(result.current.expandedFolderIds).not.toContain('f1');
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty initial notes', () => {
      const { result } = renderHook(() =>
        useNotesState({ ...defaultProps, initialNotes: [], initialFolders: [] })
      );

      expect(result.current.activeNotes).toHaveLength(0);
      expect(result.current.trashedNotes).toHaveLength(0);
      expect(result.current.pinnedNotes).toHaveLength(0);
    });

    it('handleDeleteNote clears selection when deleting selected note', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      // Select a note first
      act(() => result.current.setSelectedNoteId('n1'));

      expect(result.current.selectedNoteId).toBe('n1');

      await act(async () => {
        await result.current.handleDeleteNote('n1');
      });

      expect(result.current.selectedNoteId).toBeNull();
    });

    it('handlePermanentlyDelete clears selection when deleting selected note', async () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      act(() => result.current.setSelectedNoteId('n3'));

      await act(async () => {
        await result.current.handlePermanentlyDelete('n3');
      });

      expect(result.current.selectedNoteId).toBeNull();
    });

    it('search with no results returns empty arrays', () => {
      const { result } = renderHook(() => useNotesState(defaultProps));

      act(() => result.current.setSearchQuery('nonexistent'));

      expect(result.current.pinnedNotes).toHaveLength(0);
      expect(result.current.unfiledNotes).toHaveLength(0);
    });
  });
});
