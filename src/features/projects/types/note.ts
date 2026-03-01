import type { Tables } from '@/lib/supabase/types';

// ── Row types (from DB) ─────────────────────────────────────────────

export type ProjectNote = Tables<'project_notes'>;
export type ProjectNoteFolder = Tables<'project_note_folders'>;

/** Note metadata for the sidebar list (excludes heavy content_json). */
export type ProjectNoteMeta = Omit<ProjectNote, 'content_json'>;
