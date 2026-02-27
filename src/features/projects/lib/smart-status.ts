import type { ProjectListExtras } from '@/features/projects/actions/get-projects-list-extras';

const ENDING_SOON_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

export const SMART_STATUS_TYPES = [
  'survey_ending_soon',
  'no_active_surveys',
  'has_drafts',
  'collecting_responses',
  'no_surveys',
  'all_complete',
] as const;

export type SmartStatusType = (typeof SMART_STATUS_TYPES)[number];

export interface SmartStatus {
  type: SmartStatusType;
  /** Priority rank (0 = highest). Used for sorting. */
  priority: number;
  /** For 'survey_ending_soon': hours remaining. For 'has_drafts': draft count. */
  meta?: number;
}

export function computeSmartStatus(
  extras: ProjectListExtras | undefined,
  surveyCount: number,
  now: Date
): SmartStatus {
  if (!extras || surveyCount === 0) {
    return { type: 'no_surveys', priority: 4 };
  }

  const { draftCount, activeCount, completedCount, nearestEndsAt } = extras;

  // Priority 0: Active survey ending within 48h
  if (activeCount > 0 && nearestEndsAt) {
    const endsAt = new Date(nearestEndsAt);
    const msRemaining = endsAt.getTime() - now.getTime();

    if (msRemaining > 0 && msRemaining <= ENDING_SOON_THRESHOLD_MS) {
      return {
        type: 'survey_ending_soon',
        priority: 0,
        meta: Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60))),
      };
    }
  }

  // Priority 1: Has surveys but none active and no drafts
  if (activeCount === 0 && draftCount === 0) {
    if (completedCount === surveyCount) {
      return { type: 'all_complete', priority: 5 };
    }

    return { type: 'no_active_surveys', priority: 1 };
  }

  // Priority 2: Has draft surveys ready to launch
  if (draftCount > 0 && activeCount === 0) {
    return { type: 'has_drafts', priority: 2, meta: draftCount };
  }

  // Priority 3: Actively collecting responses
  if (activeCount > 0) {
    return { type: 'collecting_responses', priority: 3 };
  }

  // Fallback
  return { type: 'no_surveys', priority: 4 };
}
