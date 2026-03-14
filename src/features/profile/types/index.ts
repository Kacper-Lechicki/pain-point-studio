import { z } from 'zod';

import type { SocialLink } from '@/lib/common/social';

// -- Research Journey types ------------------------------------------------

export const researchJourneySchema = z.object({
  memberSince: z.string(),
  firstProjectAt: z.string().nullable(),
  firstSurveyAt: z.string().nullable(),
  firstResponseAt: z.string().nullable(),
  totalResponses: z.number(),
});

export type ResearchJourney = z.infer<typeof researchJourneySchema>;

export interface ResearchJourneyData {
  memberSince: string;
  firstProjectAt: string | null;
  firstSurveyAt: string | null;
  firstResponseAt: string | null;
  totalResponses: number;
}

export type MilestoneKey =
  | 'joined'
  | 'first_project'
  | 'first_survey'
  | 'first_response'
  | 'responses_10'
  | 'responses_50'
  | 'responses_100'
  | 'responses_500'
  | 'responses_1000';

export interface Milestone {
  key: MilestoneKey;
  achievedAt: string | null;
  isNextGoal: boolean;
}

// -- Profile Preview types -------------------------------------------------

export interface ProfilePreviewData {
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string;
  socialLinks: SocialLink[];
  memberSince: string;
  journey: Milestone[];
}
