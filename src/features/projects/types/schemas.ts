import { z } from 'zod';

import {
  INSIGHT_CONTENT_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_SUMMARY_MAX_LENGTH,
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
  summary: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(PROJECT_SUMMARY_MAX_LENGTH, 'projects.errors.summaryTooLong'),
  /** Tiptap JSONContent from the rich editor (optional). */
  description: z.any().optional(),
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
  summary: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(PROJECT_SUMMARY_MAX_LENGTH, 'projects.errors.summaryTooLong')
    .optional(),
  targetResponses: z.number().int().min(1).max(10000).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/** Schema for updating the rich description (auto-save). */
export const updateProjectDescriptionSchema = z.object({
  projectId: z.uuid(),
  description: z.any().nullable(),
});

export type UpdateProjectDescriptionInput = z.infer<typeof updateProjectDescriptionSchema>;

/** Schema for updating the project image URL. */
export const updateProjectImageSchema = z.object({
  projectId: z.uuid(),
  imageUrl: z.string().url().or(z.literal('')),
});

export type UpdateProjectImageInput = z.infer<typeof updateProjectImageSchema>;

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
