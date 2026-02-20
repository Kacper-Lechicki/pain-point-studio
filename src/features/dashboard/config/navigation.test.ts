/** Tests for sidebar navigation item lookup and sub-navigation detection. */
import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/config/routes';

import { DYNAMIC_SIDEBAR_ITEMS, SIDEBAR_NAV, findActiveNavItem } from './navigation';

// ── findActiveNavItem ───────────────────────────────────────────────

describe('findActiveNavItem', () => {
  it('should return surveys nav item for /dashboard/research', () => {
    const result = findActiveNavItem('/dashboard/research');

    expect(result).toBeDefined();
    expect(result!.href).toBe('/dashboard/research');
    expect(result!.subNav).toBeDefined();
  });

  it('should return surveys nav item for survey sub-paths', () => {
    const result = findActiveNavItem('/dashboard/research/new');

    expect(result).toBeDefined();
    expect(result!.href).toBe('/dashboard/research');
  });

  it('should return settings nav item for /settings', () => {
    const result = findActiveNavItem('/settings');

    expect(result).toBeDefined();
    expect(result!.href).toBe(ROUTES.settings.profile);
    expect(result!.activePrefix).toBe(ROUTES.common.settings);
  });

  it('should return settings nav item for settings sub-paths', () => {
    const result = findActiveNavItem('/settings/profile');

    expect(result).toBeDefined();
    expect(result!.href).toBe(ROUTES.settings.profile);
  });

  it('should return undefined for /dashboard (no subNav)', () => {
    const homeItem = SIDEBAR_NAV[0]?.items.find((i) => i.href === '/dashboard');

    // Home item exists but has no subNav, so findActiveNavItem should skip it
    expect(homeItem).toBeDefined();
    expect(homeItem!.subNav).toBeUndefined();
    expect(findActiveNavItem('/dashboard')).toBeUndefined();
  });

  it('should return analytics nav item for /dashboard/analytics (via activePrefix)', () => {
    const result = findActiveNavItem('/dashboard/analytics');

    expect(result).toBeDefined();
    expect(result!.href).toBe(ROUTES.dashboard.analyticsProjectIdea);
    expect(result!.activePrefix).toBe(ROUTES.dashboard.analytics);
  });

  it('should return analytics nav item for analytics sub-paths', () => {
    const result = findActiveNavItem('/dashboard/analytics/project-idea-evaluation');

    expect(result).toBeDefined();
    expect(result!.href).toBe(ROUTES.dashboard.analyticsProjectIdea);
  });

  it('should return undefined for unknown paths', () => {
    expect(findActiveNavItem('/unknown')).toBeUndefined();
  });
});

// ── DYNAMIC_SIDEBAR_ITEMS ─────────────────────────────────────────

describe('DYNAMIC_SIDEBAR_ITEMS', () => {
  it('should include profile preview route', () => {
    const match = DYNAMIC_SIDEBAR_ITEMS.find((item) => item.path === ROUTES.profile.preview);

    expect(match).toBeDefined();
    expect(match!.labelKey).toBe('sidebar.profilePreview');
  });

  it('should have valid AppRoute paths', () => {
    for (const item of DYNAMIC_SIDEBAR_ITEMS) {
      expect(typeof item.path).toBe('string');
      expect(item.path.startsWith('/')).toBe(true);
    }
  });
});
