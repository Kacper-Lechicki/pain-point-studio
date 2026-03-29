import { z } from 'zod';

import { PROJECT_NAME_MAX_LENGTH, PROJECT_SUMMARY_MAX_LENGTH } from '@/features/projects/config';

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
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/** Schema for updating the rich description (auto-save). */
export const updateProjectDescriptionSchema = z.object({
  projectId: z.uuid(),
  description: z.any().nullable(),
});

/** Schema for updating the project image URL. */
export const updateProjectImageSchema = z.object({
  projectId: z.uuid(),
  imageUrl: z.string().url().or(z.literal('')),
});

/** Schema for permanently deleting a project (from any status) with name confirmation. */
export const permanentDeleteProjectForceSchema = z.object({
  projectId: z.uuid(),
  confirmation: z.string().trim().min(1, 'projects.errors.fieldRequired'),
});
