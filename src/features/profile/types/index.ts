import type { SocialLink } from '@/features/settings/types';

// -- Research Journey types ------------------------------------------------

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
