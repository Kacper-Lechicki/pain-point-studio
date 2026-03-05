'use server';

import { cache } from 'react';

import type { QuestionType } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

// ── Public types ──────────────────────────────────────────────────────

export interface QuestionSignalData {
  id: string;
  text: string;
  type: QuestionType;
  config: Record<string, unknown>;
  answers: { value: Record<string, unknown> }[];
}

export interface SurveySignalData {
  surveyId: string;
  surveyTitle: string;
  researchPhase: string | null;
  totalResponses: number;
  completedResponses: number;
  questions: QuestionSignalData[];
}

// ── Server action ─────────────────────────────────────────────────────

/**
 * Fetch per-question answer data for all surveys in a project.
 * Used by `generateFindings()` to compute auto-findings for the verdict system.
 * Returns `[]` on error — safe fallback for `generateFindings`.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getProjectSignalsData = cache(
  async (projectId: string): Promise<SurveySignalData[]> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    // 1. Get all non-trashed surveys for the project
    const { data: surveys, error: surveysError } = await supabase
      .from('surveys')
      .select('id, title, research_phase, status')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .not('status', 'eq', 'trashed');

    if (surveysError || !surveys || surveys.length === 0) {
      return [];
    }

    const surveyIds = surveys.map((s) => s.id);

    // 2. Get all questions for these surveys
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('id, survey_id, text, type, config')
      .in('survey_id', surveyIds);

    if (questionsError || !questions) {
      return [];
    }

    // 3. Get all responses for these surveys
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select('id, survey_id, status')
      .in('survey_id', surveyIds);

    if (responsesError || !responses) {
      return [];
    }

    const responseIds = responses.map((r) => r.id);

    // 4. Get all answers (skip if no responses)
    let answers: { question_id: string; value: unknown }[] = [];

    if (responseIds.length > 0) {
      const { data: answersData, error: answersError } = await supabase
        .from('survey_answers')
        .select('question_id, value')
        .in('response_id', responseIds);

      if (!answersError && answersData) {
        answers = answersData;
      }
    }

    // 5. Group answers by question_id
    const answersByQuestion = new Map<string, { value: Record<string, unknown> }[]>();

    for (const answer of answers) {
      const arr = answersByQuestion.get(answer.question_id) ?? [];
      arr.push({ value: answer.value as Record<string, unknown> });
      answersByQuestion.set(answer.question_id, arr);
    }

    // 6. Group questions by survey_id
    const questionsBySurvey = new Map<string, QuestionSignalData[]>();

    for (const q of questions) {
      const arr = questionsBySurvey.get(q.survey_id) ?? [];
      arr.push({
        id: q.id,
        text: q.text,
        type: q.type as QuestionType,
        config: (q.config as Record<string, unknown>) ?? {},
        answers: answersByQuestion.get(q.id) ?? [],
      });
      questionsBySurvey.set(q.survey_id, arr);
    }

    // 7. Group responses by survey_id for counting
    const responseCountsBySurvey = new Map<string, { total: number; completed: number }>();

    for (const r of responses) {
      const counts = responseCountsBySurvey.get(r.survey_id) ?? { total: 0, completed: 0 };
      counts.total++;

      if (r.status === 'completed') {
        counts.completed++;
      }

      responseCountsBySurvey.set(r.survey_id, counts);
    }

    // 8. Assemble result
    return surveys.map((survey) => {
      const counts = responseCountsBySurvey.get(survey.id) ?? { total: 0, completed: 0 };

      return {
        surveyId: survey.id,
        surveyTitle: survey.title,
        researchPhase: survey.research_phase,
        totalResponses: counts.total,
        completedResponses: counts.completed,
        questions: questionsBySurvey.get(survey.id) ?? [],
      };
    });
  }
);
