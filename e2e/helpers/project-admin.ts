import { getAdminClient } from './supabase-admin';
import { createProjectViaDb, createSurveyWithQuestions } from './survey-admin';

type ProjectStatus = 'active' | 'completed' | 'archived' | 'trashed';

/**
 * Updates arbitrary fields on a project via the admin client (bypasses RLS).
 */
export async function updateProjectViaDb(
  projectId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from('projects').update(fields).eq('id', projectId);

  if (error) {
    throw new Error(`[e2e] Failed to update project ${projectId}: ${error.message}`);
  }
}

/**
 * Hard-deletes a project via the admin client (bypasses RLS).
 * Used for afterAll cleanup. No-op if the project doesn't exist.
 */
export async function deleteProjectViaDb(projectId: string): Promise<void> {
  const admin = getAdminClient();
  await admin.from('projects').delete().eq('id', projectId);
}

/**
 * Creates a project in a specific status.
 * Always creates as 'active' first (DB default), then updates status + metadata.
 */
export async function createProjectWithStatus(
  userId: string,
  status: ProjectStatus,
  name?: string
): Promise<string> {
  const projectId = await createProjectViaDb(userId, name ?? `E2E ${status} Project`);

  if (status === 'active') {
    return projectId;
  }

  const now = new Date().toISOString();
  const statusFields: Record<string, Record<string, unknown>> = {
    completed: { status: 'completed', completed_at: now },
    archived: { status: 'archived', archived_at: now, pre_archive_status: 'active' },
    trashed: { status: 'trashed', deleted_at: now, pre_trash_status: 'active' },
  };

  await updateProjectViaDb(projectId, statusFields[status]!);

  return projectId;
}

/**
 * Creates a project with N surveys (each with 1 question, draft status).
 */
export async function createProjectWithSurveys(
  userId: string,
  surveyCount: number,
  projectName?: string
): Promise<{ projectId: string; surveyIds: string[] }> {
  const projectId = await createProjectViaDb(userId, projectName ?? 'E2E Project with Surveys');
  const surveyIds: string[] = [];

  for (let i = 0; i < surveyCount; i++) {
    const { surveyId } = await createSurveyWithQuestions(userId, { projectId }, 1);
    surveyIds.push(surveyId);
  }

  return { projectId, surveyIds };
}

// Re-export for convenience
export { createProjectViaDb } from './survey-admin';
