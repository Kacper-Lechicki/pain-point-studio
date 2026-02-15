import { describe, expect, it } from 'vitest';

import {
  SIDEBAR_BOTTOM_ITEM,
  SIDEBAR_NAV,
  findActiveNavItem,
  hasSubNavForPath,
} from './navigation';

// ── findActiveNavItem ───────────────────────────────────────────────

describe('findActiveNavItem', () => {
  it('returns surveys nav item for /dashboard/surveys', () => {
    const result = findActiveNavItem('/dashboard/surveys');

    expect(result).toBeDefined();
    expect(result!.href).toBe('/dashboard/surveys');
    expect(result!.subNav).toBeDefined();
  });

  it('returns surveys nav item for survey sub-paths', () => {
    const result = findActiveNavItem('/dashboard/surveys/new');

    expect(result).toBeDefined();
    expect(result!.href).toBe('/dashboard/surveys');
  });

  it('returns settings nav item for /settings', () => {
    const result = findActiveNavItem('/settings');

    expect(result).toBeDefined();
    expect(result!.href).toBe(SIDEBAR_BOTTOM_ITEM.href);
  });

  it('returns settings nav item for settings sub-paths', () => {
    const result = findActiveNavItem('/settings/profile');

    expect(result).toBeDefined();
    expect(result!.href).toBe(SIDEBAR_BOTTOM_ITEM.href);
  });

  it('returns undefined for /dashboard (no subNav)', () => {
    const homeItem = SIDEBAR_NAV[0]?.items.find((i) => i.href === '/dashboard');

    // Home item exists but has no subNav, so findActiveNavItem should skip it
    expect(homeItem).toBeDefined();
    expect(homeItem!.subNav).toBeUndefined();
    expect(findActiveNavItem('/dashboard')).toBeUndefined();
  });

  it('returns undefined for /dashboard/analytics (no subNav)', () => {
    expect(findActiveNavItem('/dashboard/analytics')).toBeUndefined();
  });

  it('returns undefined for unknown paths', () => {
    expect(findActiveNavItem('/unknown')).toBeUndefined();
  });
});

// ── hasSubNavForPath ────────────────────────────────────────────────

describe('hasSubNavForPath', () => {
  it('returns true for paths with sub-navigation', () => {
    expect(hasSubNavForPath('/dashboard/surveys')).toBe(true);
    expect(hasSubNavForPath('/settings')).toBe(true);
    expect(hasSubNavForPath('/settings/profile')).toBe(true);
  });

  it('returns false for paths without sub-navigation', () => {
    expect(hasSubNavForPath('/dashboard')).toBe(false);
    expect(hasSubNavForPath('/dashboard/analytics')).toBe(false);
    expect(hasSubNavForPath('/unknown')).toBe(false);
  });
});
