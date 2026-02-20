/** Tests for dashboard layout helpers: path detection, back-navigation config, content sizing. */
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
  it('should return false for null', () => {
    expect(isBuilderPath(null)).toBe(false);
  });

  it('should return false for the builder prefix itself (no survey id)', () => {
    expect(isBuilderPath(BUILDER_PATH_PREFIX)).toBe(false);
  });

  it('should return true for builder prefix + id segment', () => {
    expect(isBuilderPath(BUILDER_PATH_PREFIX + 'abc-123')).toBe(true);
  });

  it('should return false for unrelated paths', () => {
    expect(isBuilderPath('/dashboard/research')).toBe(false);
    expect(isBuilderPath('/settings')).toBe(false);
  });
});

// ── getDashboardBackConfig ──────────────────────────────────────────

describe('getDashboardBackConfig', () => {
  it('should return null for null pathname', () => {
    expect(getDashboardBackConfig(null)).toBeNull();
  });

  it('should return survey list fallback for stats sub-path', () => {
    const config = getDashboardBackConfig('/dashboard/research/stats/abc-123');
    expect(config).toEqual({ fallbackHref: '/dashboard/research' });
  });

  it('should return survey list fallback for single survey detail', () => {
    const config = getDashboardBackConfig('/dashboard/research/some-id');
    expect(config).toEqual({ fallbackHref: '/dashboard/research' });
  });

  it('should return profile settings fallback for profile preview', () => {
    const config = getDashboardBackConfig('/profile/preview');
    expect(config).toEqual({ fallbackHref: '/settings/profile' });
  });

  it('should return null for dashboard root', () => {
    expect(getDashboardBackConfig('/dashboard')).toBeNull();
  });

  it('should return null for settings page', () => {
    expect(getDashboardBackConfig('/settings')).toBeNull();
  });
});

// ── getDashboardContentMarginLeft ───────────────────────────────────

describe('getDashboardContentMarginLeft', () => {
  it('should return expanded width when pinned without sub-panel', () => {
    expect(getDashboardContentMarginLeft(true, false)).toBe('var(--sidebar-width-expanded)');
  });

  it('should return collapsed width when unpinned without sub-panel', () => {
    expect(getDashboardContentMarginLeft(false, false)).toBe('var(--sidebar-width-collapsed)');
  });

  it('should return expanded + sub-panel when pinned with sub-panel', () => {
    const result = getDashboardContentMarginLeft(true, true);

    expect(result).toContain('--sidebar-width-expanded');
    expect(result).toContain('--sidebar-sub-panel-width');
  });

  it('should return collapsed + sub-panel when unpinned with sub-panel', () => {
    const result = getDashboardContentMarginLeft(false, true);

    expect(result).toContain('--sidebar-width-collapsed');
    expect(result).toContain('--sidebar-sub-panel-width');
  });
});

// ── getDashboardContentMaxWidth ─────────────────────────────────────

describe('getDashboardContentMaxWidth', () => {
  it('should return "content" for null pathname', () => {
    expect(getDashboardContentMaxWidth(null)).toBe('content');
  });

  it('should return "full" for survey list', () => {
    expect(getDashboardContentMaxWidth('/dashboard/research')).toBe('full');
  });

  it('should return "full" for survey archive', () => {
    expect(getDashboardContentMaxWidth('/dashboard/research/archive')).toBe('full');
  });

  it('should return "full" for locale-prefixed survey list', () => {
    expect(getDashboardContentMaxWidth('/en/dashboard/research')).toBe('full');
  });

  it('should return "narrow" for new survey', () => {
    expect(getDashboardContentMaxWidth('/dashboard/research/new')).toBe('narrow');
  });

  it('should return "narrow" for builder sub-path', () => {
    expect(getDashboardContentMaxWidth('/dashboard/research/new/abc-123')).toBe('narrow');
  });

  it('should return "narrow" for single survey detail', () => {
    expect(getDashboardContentMaxWidth('/dashboard/research/some-id')).toBe('narrow');
  });

  it('should return "narrow" for settings root', () => {
    expect(getDashboardContentMaxWidth('/settings')).toBe('narrow');
  });

  it('should return "narrow" for settings sub-page', () => {
    expect(getDashboardContentMaxWidth('/settings/profile')).toBe('narrow');
  });

  it('should return "narrow" for profile preview', () => {
    expect(getDashboardContentMaxWidth('/profile/preview')).toBe('narrow');
  });

  it('should return "narrow" for locale-prefixed settings', () => {
    expect(getDashboardContentMaxWidth('/en/settings/profile')).toBe('narrow');
  });

  it('should return "content" for dashboard root', () => {
    expect(getDashboardContentMaxWidth('/dashboard')).toBe('content');
  });

  it('should return "content" for analytics', () => {
    expect(getDashboardContentMaxWidth('/dashboard/analytics')).toBe('content');
  });
});
