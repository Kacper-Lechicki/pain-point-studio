import { z } from 'zod';

import { INSIGHT_TYPES } from './project';

// ── Project schemas ─────────────────────────────────────────────────

/** Schema for creating a new project. */
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(100, 'projects.errors.nameTooLong'),
  description: z
    .string()
    .trim()
    .max(500, 'projects.errors.descriptionTooLong')
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
    .max(100, 'projects.errors.nameTooLong'),
  description: z
    .string()
    .trim()
    .max(500, 'projects.errors.descriptionTooLong')
    .optional()
    .or(z.literal('')),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ── Insight schemas ─────────────────────────────────────────────────

/** Schema for creating a new manual insight/note. */
export const createInsightSchema = z.object({
  projectId: z.uuid(),
  type: z.enum(INSIGHT_TYPES),
  content: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(500, 'projects.errors.contentTooLong'),
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
    .max(500, 'projects.errors.contentTooLong')
    .optional(),
});

export type UpdateInsightInput = z.infer<typeof updateInsightSchema>;
