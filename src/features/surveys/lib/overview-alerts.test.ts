import { describe, expect, it } from 'vitest';

import type { SurveyStats } from '@/features/surveys/types';

import { getOverviewAlert } from './overview-alerts';

function makeStats(overrides: Partial<SurveyStats> = {}): SurveyStats {
  return {
    survey: {
      id: '1',
      title: 'Test',
      slug: 'test',
      status: 'active',
      startsAt: null,
      endsAt: null,
      maxRespondents: null,
    },
    viewCount: 0,
    totalResponses: 0,
    completedResponses: 0,
    inProgressResponses: 0,
    responseTimeline: [],
    avgCompletionSeconds: null,
    firstResponseAt: null,
    lastResponseAt: null,
    deviceTimeline: [],
    questions: [],
    ...overrides,
  };
}

describe('getOverviewAlert', () => {
  it('returns null when no thresholds are breached', () => {
    const stats = makeStats({ totalResponses: 10, completedResponses: 8 });
    expect(getOverviewAlert(stats)).toBeNull();
  });

  it('returns low-completion when rate < 50% with >= 5 responses', () => {
    const stats = makeStats({ totalResponses: 10, completedResponses: 3 });
    const alert = getOverviewAlert(stats);
    expect(alert).toEqual({
      type: 'low-completion',
      messageKey: 'surveys.stats.overview.alertLowCompletion',
      values: { rate: 30 },
    });
  });

  it('does not fire low-completion with < 5 responses', () => {
    const stats = makeStats({ totalResponses: 4, completedResponses: 1 });
    expect(getOverviewAlert(stats)).toBeNull();
  });

  it('returns approaching-cap when responses >= 80% of max', () => {
    const stats = makeStats({
      totalResponses: 82,
      completedResponses: 82,
      survey: { ...makeStats().survey, maxRespondents: 100 },
    });
    const alert = getOverviewAlert(stats);
    expect(alert).toEqual({
      type: 'approaching-cap',
      messageKey: 'surveys.stats.overview.alertApproachingCap',
      values: { current: 82, max: 100 },
    });
  });

  it('does not fire approaching-cap when maxRespondents is null', () => {
    const stats = makeStats({ totalResponses: 999, completedResponses: 999 });
    expect(getOverviewAlert(stats)).toBeNull();
  });

  it('low-completion takes priority over approaching-cap', () => {
    const stats = makeStats({
      totalResponses: 90,
      completedResponses: 20,
      survey: { ...makeStats().survey, maxRespondents: 100 },
    });
    const alert = getOverviewAlert(stats);
    expect(alert?.type).toBe('low-completion');
  });
});
