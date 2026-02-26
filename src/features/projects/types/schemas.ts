import { z } from 'zod';

import {
  INSIGHT_CONTENT_MAX_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NOTES_MAX_LENGTH,
} from '@/features/projects/config';

import { INSIGHT_TYPES } from './project';

// ── Project schemas ─────────────────────────────────────────────────

/** Schema for creating a new project. */
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(PROJECT_NAME_MAX_LENGTH, 'projects.errors.nameTooLong'),
  description: z
    .string()
    .trim()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH, 'projects.errors.descriptionTooLong')
    .optional()
    .or(z.literal('')),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/** Schema for updating an existing project. */
export const updateProjectSchema = z.object({
  projectId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(PROJECT_NAME_MAX_LENGTH, 'projects.errors.nameTooLong'),
  description: z
    .string()
    .trim()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH, 'projects.errors.descriptionTooLong')
    .optional()
    .or(z.literal('')),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ── Notes schemas ───────────────────────────────────────────────────

/** Schema for updating project notes (auto-save). */
export const updateProjectNotesSchema = z.object({
  projectId: z.uuid(),
  notes: z
    .string()
    .max(PROJECT_NOTES_MAX_LENGTH, 'projects.errors.notesTooLong')
    .optional()
    .or(z.literal('')),
});

export type UpdateProjectNotesInput = z.infer<typeof updateProjectNotesSchema>;

// ── Insight schemas ─────────────────────────────────────────────────

/** Schema for creating a new manual insight/note. */
export const createInsightSchema = z.object({
  projectId: z.uuid(),
  type: z.enum(INSIGHT_TYPES),
  content: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(INSIGHT_CONTENT_MAX_LENGTH, 'projects.errors.contentTooLong'),
});

export type CreateInsightInput = z.infer<typeof createInsightSchema>;

/** Schema for updating an existing insight/note. */
export const updateInsightSchema = z.object({
  insightId: z.uuid(),
  type: z.enum(INSIGHT_TYPES).optional(),
  content: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(INSIGHT_CONTENT_MAX_LENGTH, 'projects.errors.contentTooLong')
    .optional(),
});

export type UpdateInsightInput = z.infer<typeof updateInsightSchema>;
