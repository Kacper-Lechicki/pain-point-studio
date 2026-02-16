import { describe, expect, it } from 'vitest';

import {
  BUILDER_PATH_PREFIX,
  getDashboardBackConfig,
  getDashboardContentMarginLeft,
  getDashboardContentMaxWidth,
  isBuilderPath,
} from './layout';

// ── isBuilderPath ───────────────────────────────────────────────────

describe('isBuilderPath', () => {
  it('returns false for null', () => {
    expect(isBuilderPath(null)).toBe(false);
  });

  it('returns false for the builder prefix itself (no survey id)', () => {
    expect(isBuilderPath(BUILDER_PATH_PREFIX)).toBe(false);
  });

  it('returns true for builder prefix + id segment', () => {
    expect(isBuilderPath(BUILDER_PATH_PREFIX + 'abc-123')).toBe(true);
  });

  it('returns false for unrelated paths', () => {
    expect(isBuilderPath('/dashboard/surveys')).toBe(false);
    expect(isBuilderPath('/settings')).toBe(false);
  });
});

// ── getDashboardBackConfig ──────────────────────────────────────────

describe('getDashboardBackConfig', () => {
  it('returns null for null pathname', () => {
    expect(getDashboardBackConfig(null)).toBeNull();
  });

  it('returns survey list fallback for stats sub-path', () => {
    const config = getDashboardBackConfig('/dashboard/surveys/stats/abc-123');

    expect(config).toEqual({ fallbackHref: '/dashboard/surveys' });
  });

  it('returns survey list fallback for single survey detail', () => {
    const config = getDashboardBackConfig('/dashboard/surveys/some-id');

    expect(config).toEqual({ fallbackHref: '/dashboard/surveys' });
  });

  it('returns profile settings fallback for profile preview', () => {
    const config = getDashboardBackConfig('/profile/preview');

    expect(config).toEqual({ fallbackHref: '/settings/profile' });
  });

  it('returns null for dashboard root', () => {
    expect(getDashboardBackConfig('/dashboard')).toBeNull();
  });

  it('returns null for settings page', () => {
    expect(getDashboardBackConfig('/settings')).toBeNull();
  });
});

// ── getDashboardContentMarginLeft ───────────────────────────────────

describe('getDashboardContentMarginLeft', () => {
  it('returns expanded width when pinned without sub-panel', () => {
    expect(getDashboardContentMarginLeft(true, false)).toBe('var(--sidebar-width-expanded)');
  });

  it('returns collapsed width when unpinned without sub-panel', () => {
    expect(getDashboardContentMarginLeft(false, false)).toBe('var(--sidebar-width-collapsed)');
  });

  it('returns expanded + sub-panel when pinned with sub-panel', () => {
    const result = getDashboardContentMarginLeft(true, true);

    expect(result).toContain('--sidebar-width-expanded');
    expect(result).toContain('--sidebar-sub-panel-width');
  });

  it('returns collapsed + sub-panel when unpinned with sub-panel', () => {
    const result = getDashboardContentMarginLeft(false, true);

    expect(result).toContain('--sidebar-width-collapsed');
    expect(result).toContain('--sidebar-sub-panel-width');
  });
});

// ── getDashboardContentMaxWidth ─────────────────────────────────────

describe('getDashboardContentMaxWidth', () => {
  it('returns "content" for null pathname', () => {
    expect(getDashboardContentMaxWidth(null)).toBe('content');
  });

  // Full-width routes
  it('returns "full" for survey list', () => {
    expect(getDashboardContentMaxWidth('/dashboard/surveys')).toBe('full');
  });

  it('returns "full" for survey archive', () => {
    expect(getDashboardContentMaxWidth('/dashboard/surveys/archive')).toBe('full');
  });

  it('returns "full" for locale-prefixed survey list', () => {
    expect(getDashboardContentMaxWidth('/en/dashboard/surveys')).toBe('full');
  });

  // Narrow routes
  it('returns "narrow" for new survey', () => {
    expect(getDashboardContentMaxWidth('/dashboard/surveys/new')).toBe('narrow');
  });

  it('returns "narrow" for builder sub-path', () => {
    expect(getDashboardContentMaxWidth('/dashboard/surveys/new/abc-123')).toBe('narrow');
  });

  it('returns "narrow" for single survey detail', () => {
    expect(getDashboardContentMaxWidth('/dashboard/surveys/some-id')).toBe('narrow');
  });

  it('returns "narrow" for settings root', () => {
    expect(getDashboardContentMaxWidth('/settings')).toBe('narrow');
  });

  it('returns "narrow" for settings sub-page', () => {
    expect(getDashboardContentMaxWidth('/settings/profile')).toBe('narrow');
  });

  it('returns "narrow" for profile preview', () => {
    expect(getDashboardContentMaxWidth('/profile/preview')).toBe('narrow');
  });

  it('returns "narrow" for locale-prefixed settings', () => {
    expect(getDashboardContentMaxWidth('/en/settings/profile')).toBe('narrow');
  });

  // Default content width
  it('returns "content" for dashboard root', () => {
    expect(getDashboardContentMaxWidth('/dashboard')).toBe('content');
  });

  it('returns "content" for analytics', () => {
    expect(getDashboardContentMaxWidth('/dashboard/analytics')).toBe('content');
  });
});
