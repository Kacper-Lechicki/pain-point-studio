import { z } from 'zod';

import { FOLDER_NAME_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from '@/features/projects/config';

// ── Note schemas ────────────────────────────────────────────────────

/** Create a new note. */
export const createProjectNoteSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().max(NOTE_TITLE_MAX_LENGTH).optional(),
  folderId: z.uuid().nullable().optional(),
});

export type CreateProjectNoteInput = z.infer<typeof createProjectNoteSchema>;

/** Update note content (auto-save). */
export const updateProjectNoteSchema = z.object({
  noteId: z.uuid(),
  content: z.any().nullable(),
});

export type UpdateProjectNoteInput = z.infer<typeof updateProjectNoteSchema>;

/** Soft-delete a note (move to trash). */
export const deleteProjectNoteSchema = z.object({
  noteId: z.uuid(),
});

/** Restore a note from trash. */
export const restoreProjectNoteSchema = z.object({
  noteId: z.uuid(),
});

/** Permanently delete a trashed note. */
export const permanentlyDeleteProjectNoteSchema = z.object({
  noteId: z.uuid(),
});

/** Duplicate a note. */
export const duplicateProjectNoteSchema = z.object({
  noteId: z.uuid(),
});

/** Toggle pin state. */
export const togglePinProjectNoteSchema = z.object({
  noteId: z.uuid(),
  isPinned: z.boolean(),
});

/** Reorder notes (array of IDs in new order). */
export const reorderProjectNotesSchema = z.object({
  noteIds: z.array(z.uuid()),
});

/** Move a note to a folder (or unfiled). */
export const moveNoteToFolderSchema = z.object({
  noteId: z.uuid(),
  folderId: z.uuid().nullable(),
});

// ── Folder schemas ──────────────────────────────────────────────────

/** Create a new folder. */
export const createNoteFolderSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(1).max(FOLDER_NAME_MAX_LENGTH),
});

export type CreateNoteFolderInput = z.infer<typeof createNoteFolderSchema>;

/** Rename a folder. */
export const updateNoteFolderSchema = z.object({
  folderId: z.uuid(),
  name: z.string().trim().min(1).max(FOLDER_NAME_MAX_LENGTH),
});

/** Delete a folder (notes become unfiled). */
export const deleteNoteFolderSchema = z.object({
  folderId: z.uuid(),
});

/** Reorder folders (array of IDs in new order). */
export const reorderNoteFoldersSchema = z.object({
  folderIds: z.array(z.uuid()),
});

/** Permanently delete all trashed notes for a project. */
export const emptyTrashSchema = z.object({
  projectId: z.uuid(),
});
