import { z } from 'zod';

import type { SurveyStatus } from './index';

export const userSurveySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  slug: z.string().nullable(),
  viewCount: z.number().default(0),
  responseCount: z.number(),
  completedCount: z.number(),
  questionCount: z.number(),
  recentActivity: z.array(z.number()),
  lastResponseAt: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  maxRespondents: z.number().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  avgCompletionSeconds: z.number().nullable(),
  avgQuestionCompletion: z.number().nullable(),
  projectId: z.string(),
  projectName: z.string(),
  researchPhase: z.string().nullable().optional().default(null),
  deletedAt: z.string().nullable().optional().default(null),
  preTrashStatus: z.string().nullable().optional().default(null),
});

export const userSurveysRpcSchema = z.array(userSurveySchema);

export interface UserSurvey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  slug: string | null;
  viewCount: number;
  responseCount: number;
  completedCount: number;
  questionCount: number;
  recentActivity: number[];
  lastResponseAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  maxRespondents: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  avgCompletionSeconds: number | null;
  avgQuestionCompletion: number | null;
  projectId: string;
  projectName: string;
  researchPhase: string | null;
  deletedAt: string | null;
  preTrashStatus: string | null;
}
