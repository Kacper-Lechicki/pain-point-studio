'use server';

import { withProtectedAction } from '@/lib/common/with-protected-action';

import { slugifyTitle } from '../lib/generate-slug';
import { type QuestionType, surveyIdSchema } from '../types';

function formatAnswerValue(type: QuestionType, value: Record<string, unknown>): string {
  switch (type) {
    case 'open_text':
    case 'short_text':
      return (value.text as string) ?? '';
    case 'multiple_choice': {
      const selected = (value.selected as string[]) ?? [];
      const other = value.other as string | undefined;

      return other ? [...selected, `Other: ${other}`].join('; ') : selected.join('; ');
    }

    case 'rating_scale':
      return String(value.rating ?? '');
    case 'yes_no':
      return value.answer === true ? 'Yes' : value.answer === false ? 'No' : '';
    default:
      return JSON.stringify(value);
  }
}

function escapeCsvField(field: string): string {
  // Prevent spreadsheet formula injection (=, +, -, @)
  const sanitized = /^[=+\-@]/.test(field) ? `\t${field}` : field;

  if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

async function fetchExportData(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  surveyId: string,
  userId: string
) {
  const { data: survey } = await supabase
    .from('surveys')
    .select('id, title')
    .eq('id', surveyId)
    .eq('user_id', userId)
    .single();

  if (!survey) {
    return null;
  }

  const { data: questions } = await supabase
    .from('survey_questions')
    .select('id, text, type, sort_order')
    .eq('survey_id', surveyId)
    .order('sort_order');

  const { data: responses } = await supabase
    .from('survey_responses')
    .select('id, completed_at, contact_name, contact_email, feedback')
    .eq('survey_id', surveyId)
    .eq('status', 'completed')
    .order('completed_at');

  const responseIds = (responses ?? []).map((r) => r.id);
  let answers: Array<{ response_id: string; question_id: string; value: unknown }> = [];

  if (responseIds.length > 0) {
    const { data } = await supabase
      .from('survey_answers')
      .select('response_id, question_id, value')
      .in('response_id', responseIds);

    answers = data ?? [];
  }

  // Group answers by response_id then question_id
  const answerMap = new Map<string, Map<string, Record<string, unknown>>>();

  for (const a of answers) {
    let responseMap = answerMap.get(a.response_id);

    if (!responseMap) {
      responseMap = new Map();
      answerMap.set(a.response_id, responseMap);
    }

    responseMap.set(a.question_id, a.value as Record<string, unknown>);
  }

  return { survey, questions: questions ?? [], responses: responses ?? [], answerMap };
}

export const exportSurveyCSV = withProtectedAction<
  typeof surveyIdSchema,
  { csv: string; filename: string }
>('export-survey-csv', {
  schema: surveyIdSchema,
  rateLimit: { limit: 10, windowSeconds: 60 },
  action: async ({ data, user, supabase }) => {
    const result = await fetchExportData(supabase, data.surveyId, user.id);

    if (!result) {
      return { error: 'surveys.errors.unexpected' };
    }

    const { survey, questions, responses, answerMap } = result;

    // Build CSV header
    const headers = [
      'Response ID',
      'Completed At',
      'Contact Name',
      'Contact Email',
      'Feedback',
      ...questions.map((q) => q.text),
    ];

    const rows = responses.map((r) => {
      const responseAnswers = answerMap.get(r.id);

      return [
        r.id,
        r.completed_at ?? '',
        r.contact_name ?? '',
        r.contact_email ?? '',
        r.feedback ?? '',
        ...questions.map((q) => {
          const value = responseAnswers?.get(q.id);

          return value ? formatAnswerValue(q.type as QuestionType, value) : '';
        }),
      ];
    });

    const csv = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\n');

    const slug = slugifyTitle(survey.title);
    const filename = `${slug}-responses.csv`;

    return { success: true, data: { csv, filename } };
  },
});

export const exportSurveyJSON = withProtectedAction<
  typeof surveyIdSchema,
  { json: string; filename: string }
>('export-survey-json', {
  schema: surveyIdSchema,
  rateLimit: { limit: 10, windowSeconds: 60 },
  action: async ({ data, user, supabase }) => {
    const result = await fetchExportData(supabase, data.surveyId, user.id);

    if (!result) {
      return { error: 'surveys.errors.unexpected' };
    }

    const { survey, questions, responses, answerMap } = result;

    const exportData = {
      survey: { id: survey.id, title: survey.title },
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        sortOrder: q.sort_order,
      })),
      responses: responses.map((r) => {
        const responseAnswers = answerMap.get(r.id);

        return {
          id: r.id,
          completedAt: r.completed_at,
          contactName: r.contact_name,
          contactEmail: r.contact_email,
          feedback: r.feedback,
          answers: questions.map((q) => ({
            questionId: q.id,
            questionText: q.text,
            type: q.type,
            value: responseAnswers?.get(q.id) ?? null,
          })),
        };
      }),
    };

    const json = JSON.stringify(exportData, null, 2);
    const slug = slugifyTitle(survey.title);
    const filename = `${slug}-responses.json`;

    return { success: true, data: { json, filename } };
  },
});
