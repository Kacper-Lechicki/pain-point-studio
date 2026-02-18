/** Tests for sidebar navigation item lookup and sub-navigation detection. */
import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/config/routes';

import { SIDEBAR_NAV, findActiveNavItem, hasSubNavForPath } from './navigation';

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
    expect(result!.href).toBe(ROUTES.common.settings);
  });

  it('should return settings nav item for settings sub-paths', () => {
    const result = findActiveNavItem('/settings/profile');

    expect(result).toBeDefined();
    expect(result!.href).toBe(ROUTES.common.settings);
  });

  it('should return undefined for /dashboard (no subNav)', () => {
    const homeItem = SIDEBAR_NAV[0]?.items.find((i) => i.href === '/dashboard');

    // Home item exists but has no subNav, so findActiveNavItem should skip it
    expect(homeItem).toBeDefined();
    expect(homeItem!.subNav).toBeUndefined();
    expect(findActiveNavItem('/dashboard')).toBeUndefined();
  });

  it('should return undefined for /dashboard/analytics (no subNav)', () => {
    expect(findActiveNavItem('/dashboard/analytics')).toBeUndefined();
  });

  it('should return undefined for unknown paths', () => {
    expect(findActiveNavItem('/unknown')).toBeUndefined();
  });
});

// ── hasSubNavForPath ────────────────────────────────────────────────

describe('hasSubNavForPath', () => {
  it('should return true for paths with sub-navigation', () => {
    expect(hasSubNavForPath('/dashboard/research')).toBe(true);
    expect(hasSubNavForPath('/settings')).toBe(true);
    expect(hasSubNavForPath('/settings/profile')).toBe(true);
  });

  it('should return false for paths without sub-navigation', () => {
    expect(hasSubNavForPath('/dashboard')).toBe(false);
    expect(hasSubNavForPath('/dashboard/analytics')).toBe(false);
    expect(hasSubNavForPath('/unknown')).toBe(false);
  });
});
