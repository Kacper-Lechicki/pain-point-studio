import { describe, expect, it } from 'vitest';

import {
  getSurveyDetailUrl,
  getSurveyEditUrl,
  getSurveyPublishUrl,
  getSurveyStatsUrl,
} from './survey-urls';

describe('getSurveyEditUrl', () => {
  it('should return the edit URL for a given survey ID', () => {
    expect(getSurveyEditUrl('abc-123')).toBe('/dashboard/research/new/abc-123');
  });
});

describe('getSurveyPublishUrl', () => {
  it('should return the edit URL with publish query param', () => {
    expect(getSurveyPublishUrl('abc-123')).toBe('/dashboard/research/new/abc-123?publish=true');
  });
});

describe('getSurveyStatsUrl', () => {
  it('should return the stats URL for a given survey ID', () => {
    expect(getSurveyStatsUrl('abc-123')).toBe('/dashboard/research/stats/abc-123');
  });
});

describe('getSurveyDetailUrl', () => {
  it('should return the detail URL for a given survey ID', () => {
    expect(getSurveyDetailUrl('abc-123')).toBe('/dashboard/research/stats/abc-123');
  });
});
