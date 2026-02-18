/** Tests for sub-navigation href building, search-param collection, and active-state matching. */
import { describe, expect, it } from 'vitest';

import type { SubNavGroup, SubNavItem } from '@/features/dashboard/config/navigation';

import { collectSearchParamKeys, getSubItemHref, isSubItemActive } from './nav-utils';

// ── getSubItemHref ──────────────────────────────────────────────────

describe('getSubItemHref', () => {
  const base: SubNavItem = {
    labelKey: 'sidebar.allSurveys' as SubNavItem['labelKey'],
    icon: (() => null) as unknown as SubNavItem['icon'],
    href: '/dashboard/research' as SubNavItem['href'],
  };

  it('should return plain href when no searchParams or hash', () => {
    expect(getSubItemHref(base)).toBe('/dashboard/research');
  });

  it('should append hash when defined', () => {
    expect(getSubItemHref({ ...base, hash: 'section' })).toBe('/dashboard/research#section');
  });

  it('should append searchParams as query string', () => {
    expect(getSubItemHref({ ...base, searchParams: { status: 'active' } })).toBe(
      '/dashboard/research?status=active'
    );
  });

  it('should append both searchParams and hash', () => {
    expect(getSubItemHref({ ...base, searchParams: { tab: 'all' }, hash: 'top' })).toBe(
      '/dashboard/research?tab=all#top'
    );
  });

  it('should encode special characters in searchParams', () => {
    const href = getSubItemHref({ ...base, searchParams: { q: 'hello world' } });

    expect(href).toBe('/dashboard/research?q=hello+world');
  });
});

// ── collectSearchParamKeys ──────────────────────────────────────────

describe('collectSearchParamKeys', () => {
  const item = (sp?: Record<string, string>): SubNavItem => ({
    labelKey: 'sidebar.allSurveys' as SubNavItem['labelKey'],
    icon: (() => null) as unknown as SubNavItem['icon'],
    href: '/dashboard/research' as SubNavItem['href'],
    searchParams: sp,
  });

  it('should return empty array when no items have searchParams', () => {
    const groups: SubNavGroup[] = [{ items: [item(), item()] }];

    expect(collectSearchParamKeys(groups)).toEqual([]);
  });

  it('should collect unique keys from a single group', () => {
    const groups: SubNavGroup[] = [
      { items: [item({ status: 'active' }), item({ status: 'draft', tab: 'all' })] },
    ];

    expect(collectSearchParamKeys(groups)).toEqual(['status', 'tab']);
  });

  it('should collect keys across multiple groups', () => {
    const groups: SubNavGroup[] = [
      { items: [item({ status: 'active' })] },
      { items: [item({ view: 'grid' })] },
    ];

    expect(collectSearchParamKeys(groups)).toEqual(['status', 'view']);
  });

  it('should deduplicate keys', () => {
    const groups: SubNavGroup[] = [
      { items: [item({ status: 'active' }), item({ status: 'draft' })] },
    ];

    expect(collectSearchParamKeys(groups)).toEqual(['status']);
  });

  it('should skip items without searchParams', () => {
    const groups: SubNavGroup[] = [{ items: [item(), item({ status: 'active' })] }];

    expect(collectSearchParamKeys(groups)).toEqual(['status']);
  });
});

// ── isSubItemActive ─────────────────────────────────────────────────

describe('isSubItemActive', () => {
  const item = (overrides?: Partial<SubNavItem>): SubNavItem => ({
    labelKey: 'sidebar.allSurveys' as SubNavItem['labelKey'],
    icon: (() => null) as unknown as SubNavItem['icon'],
    href: '/dashboard/research' as SubNavItem['href'],
    ...overrides,
  });

  it('should match hash item when pathname and hash match', () => {
    const result = isSubItemActive(
      item({ hash: 'section' }),
      '/dashboard/research',
      'section',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(true);
  });

  it('should reject hash item when hash differs', () => {
    const result = isSubItemActive(
      item({ hash: 'section' }),
      '/dashboard/research',
      'other',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(false);
  });

  it('should reject hash item when pathname differs', () => {
    const result = isSubItemActive(
      item({ hash: 'section' }),
      '/settings',
      'section',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(false);
  });

  it('should match searchParams item when all params match', () => {
    const result = isSubItemActive(
      item({ searchParams: { status: 'active' } }),
      '/dashboard/research',
      '',
      new URLSearchParams('status=active'),
      ['status']
    );

    expect(result).toBe(true);
  });

  it('should reject searchParams item when param value differs', () => {
    const result = isSubItemActive(
      item({ searchParams: { status: 'active' } }),
      '/dashboard/research',
      '',
      new URLSearchParams('status=draft'),
      ['status']
    );

    expect(result).toBe(false);
  });

  it('should reject searchParams item when pathname differs', () => {
    const result = isSubItemActive(
      item({ searchParams: { status: 'active' } }),
      '/other',
      '',
      new URLSearchParams('status=active'),
      ['status']
    );

    expect(result).toBe(false);
  });

  it('should match plain item when pathname matches and no search params present', () => {
    const result = isSubItemActive(item(), '/dashboard/research', '', new URLSearchParams(), [
      'status',
    ]);

    expect(result).toBe(true);
  });

  it('should reject plain item when a tracked search param is present in URL', () => {
    const result = isSubItemActive(
      item(),
      '/dashboard/research',
      '',
      new URLSearchParams('status=active'),
      ['status']
    );

    expect(result).toBe(false);
  });

  it('should match alsoActiveFor paths', () => {
    const result = isSubItemActive(
      item({ alsoActiveFor: ['/alt-path'] }),
      '/alt-path',
      '',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(true);
  });

  it('should return false when nothing matches', () => {
    const result = isSubItemActive(item(), '/other', '', new URLSearchParams(), []);

    expect(result).toBe(false);
  });
});
