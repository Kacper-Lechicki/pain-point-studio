import type { ProjectStatus } from '@/features/projects/types';

import { getAdminClient } from './supabase-admin';
import { createProjectViaDb, createSurveyWithQuestions } from './survey-admin';

export { createProjectViaDb } from './survey-admin';

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

export async function deleteProjectViaDb(projectId: string): Promise<void> {
  const admin = getAdminClient();
  await admin.from('projects').delete().eq('id', projectId);
}

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
