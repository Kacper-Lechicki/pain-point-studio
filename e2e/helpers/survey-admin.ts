import type { QuestionType, SurveyStatus } from '@/features/surveys/types';

import { getAdminClient } from './supabase-admin';

interface CreateSurveyOptions {
  userId: string;
  projectId: string;
  title?: string;
  description?: string;
  status?: SurveyStatus;
  slug?: string | null;
  startsAt?: string | null;
  maxRespondents?: number | null;
}

interface CreateQuestionOptions {
  surveyId: string;
  text?: string;
  type?: QuestionType;
  sortOrder: number;
  required?: boolean;
  config?: Record<string, unknown>;
}

export function generateSlug(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);

  return `e2e_${ts}_${rand}`;
}

export async function createProjectViaDb(
  userId: string,
  name = 'E2E Test Project'
): Promise<string> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from('projects')
    .insert({ user_id: userId, name, status: 'active' })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[e2e] Failed to create project: ${error?.message ?? 'no data returned'}`);
  }

  return data.id;
}

export async function createSurveyViaDb(options: CreateSurveyOptions): Promise<string> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from('surveys')
    .insert({
      user_id: options.userId,
      project_id: options.projectId,
      title: options.title ?? `E2E Survey ${Date.now()}`,
      description: options.description ?? 'E2E test survey',
      visibility: 'private',
      status: options.status ?? 'draft',
      slug: options.slug ?? null,
      starts_at: options.startsAt ?? null,
      max_respondents: options.maxRespondents ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[e2e] Failed to create survey: ${error?.message ?? 'no data returned'}`);
  }

  return data.id;
}

export async function createQuestionViaDb(options: CreateQuestionOptions): Promise<string> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from('survey_questions')
    .insert({
      survey_id: options.surveyId,
      text: options.text ?? `E2E Test Question ${options.sortOrder + 1}`,
      type: options.type ?? 'open_text',
      sort_order: options.sortOrder,
      required: options.required ?? true,
      config: options.config ?? {},
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[e2e] Failed to create question: ${error?.message ?? 'no data returned'}`);
  }

  return data.id;
}

export async function updateSurveyViaDb(
  surveyId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from('surveys').update(fields).eq('id', surveyId);

  if (error) {
    throw new Error(`[e2e] Failed to update survey ${surveyId}: ${error.message}`);
  }
}

export async function createSurveyWithQuestions(
  userId: string,
  surveyOverrides: Partial<Omit<CreateSurveyOptions, 'userId'>> & { projectId: string },
  questionCount = 1
): Promise<{ surveyId: string; questionIds: string[] }> {
  const isActive = surveyOverrides?.status === 'active';

  const surveyId = await createSurveyViaDb({
    userId,
    ...surveyOverrides,
    slug: isActive ? (surveyOverrides?.slug ?? generateSlug()) : (surveyOverrides?.slug ?? null),
    startsAt: isActive
      ? (surveyOverrides?.startsAt ?? new Date().toISOString())
      : (surveyOverrides?.startsAt ?? null),
  });

  const questionIds: string[] = [];

  for (let i = 0; i < questionCount; i++) {
    const id = await createQuestionViaDb({
      surveyId,
      text: `E2E Test Question ${i + 1}`,
      type: 'open_text',
      sortOrder: i,
    });

    questionIds.push(id);
  }

  return { surveyId, questionIds };
}

export async function createResponseViaDb(
  surveyId: string,
  status: 'in_progress' | 'completed' | 'abandoned' = 'completed'
): Promise<string> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[e2e] Failed to create response: ${error?.message ?? 'no data returned'}`);
  }

  return data.id;
}

export async function createAnswerViaDb(
  responseId: string,
  questionId: string,
  value: Record<string, unknown>
): Promise<string> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from('survey_answers')
    .insert({
      response_id: responseId,
      question_id: questionId,
      value,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[e2e] Failed to create answer: ${error?.message ?? 'no data returned'}`);
  }

  return data.id;
}

export async function createCompletedSurveyWithResponses(
  userId: string,
  projectId: string,
  responseCount = 5,
  title?: string
): Promise<{ surveyId: string; questionIds: string[]; title: string }> {
  const surveyTitle = title ?? `E2E Insights Survey ${Date.now()}`;
  const surveyId = await createSurveyViaDb({
    userId,
    projectId,
    title: surveyTitle,
    status: 'active',
    slug: generateSlug(),
    startsAt: new Date().toISOString(),
  });

  const questionId = await createQuestionViaDb({
    surveyId,
    text: 'Is this feature useful?',
    type: 'yes_no',
    sortOrder: 0,
  });

  const questionIds = [questionId];

  for (let i = 0; i < responseCount; i++) {
    const responseId = await createResponseViaDb(surveyId, 'completed');

    for (const questionId of questionIds) {
      await createAnswerViaDb(responseId, questionId, { answer: true });
    }
  }

  await updateSurveyViaDb(surveyId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  return { surveyId, questionIds, title: surveyTitle };
}
