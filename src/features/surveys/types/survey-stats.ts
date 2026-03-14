import { z } from 'zod';

import type { QuestionType, SurveyStatus } from './index';

export interface QuestionAnswerData {
  value: Record<string, unknown>;
  completedAt: string | null;
}

export interface QuestionStats {
  id: string;
  text: string;
  type: QuestionType;
  sortOrder: number;
  config: Record<string, unknown>;
  answers: QuestionAnswerData[];
}

export interface DeviceTimelinePoint {
  desktop: number;
  mobile: number;
}

export interface SurveyStats {
  survey: {
    id: string;
    title: string;
    slug: string | null;
    status: SurveyStatus;
    startsAt: string | null;
    endsAt: string | null;
    maxRespondents: number | null;
  };
  viewCount: number;
  totalResponses: number;
  completedResponses: number;
  inProgressResponses: number;
  responseTimeline: number[];
  avgCompletionSeconds: number | null;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
  deviceTimeline: DeviceTimelinePoint[];
  questions: QuestionStats[];
}

export const surveyStatsRpcSchema = z.object({
  survey: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string().nullable(),
    status: z.string(),
    startsAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
    endsAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
    maxRespondents: z.number().nullable(),
  }),
  viewCount: z.number().default(0),
  totalResponses: z.number(),
  completedResponses: z.number(),
  inProgressResponses: z.number(),
  responseTimeline: z.array(z.number()).default([]),
  avgCompletionSeconds: z.number().nullable().default(null),
  firstResponseAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
  lastResponseAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
  deviceTimeline: z.array(z.object({ desktop: z.number(), mobile: z.number() })).default([]),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        type: z.string(),
        sortOrder: z.number(),
        config: z.record(z.string(), z.unknown()).default({}),
        answers: z.array(
          z.object({
            value: z.record(z.string(), z.unknown()),
            completedAt: z.string().nullable(),
          })
        ),
      })
    )
    .default([]),
});
