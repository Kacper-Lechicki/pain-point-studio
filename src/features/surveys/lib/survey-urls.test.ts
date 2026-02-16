import { describe, expect, it } from 'vitest';

import {
  getSurveyDetailUrl,
  getSurveyEditUrl,
  getSurveyPublishUrl,
  getSurveyStatsUrl,
} from './survey-urls';

// ── getSurveyEditUrl ────────────────────────────────────────────────

describe('getSurveyEditUrl', () => {
  it('returns the edit URL for a given survey ID', () => {
    expect(getSurveyEditUrl('abc-123')).toBe('/dashboard/surveys/new/abc-123');
  });
});

// ── getSurveyPublishUrl ─────────────────────────────────────────────

describe('getSurveyPublishUrl', () => {
  it('returns the edit URL with publish query param', () => {
    expect(getSurveyPublishUrl('abc-123')).toBe('/dashboard/surveys/new/abc-123?publish=true');
  });
});

// ── getSurveyStatsUrl ───────────────────────────────────────────────

describe('getSurveyStatsUrl', () => {
  it('returns the stats URL for a given survey ID', () => {
    expect(getSurveyStatsUrl('abc-123')).toBe('/dashboard/surveys/stats/abc-123');
  });
});

// ── getSurveyDetailUrl ──────────────────────────────────────────────

describe('getSurveyDetailUrl', () => {
  it('returns the detail URL for a given survey ID', () => {
    expect(getSurveyDetailUrl('abc-123')).toBe('/dashboard/surveys/abc-123');
  });
});
