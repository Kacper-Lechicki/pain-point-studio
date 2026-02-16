import { describe, expect, it } from 'vitest';

import type { SubNavGroup, SubNavItem } from '@/features/dashboard/config/navigation';

import { collectSearchParamKeys, getSubItemHref, isSubItemActive } from './nav-utils';

// ── getSubItemHref ──────────────────────────────────────────────────

describe('getSubItemHref', () => {
  const base: SubNavItem = {
    labelKey: 'sidebar.allSurveys' as SubNavItem['labelKey'],
    icon: (() => null) as unknown as SubNavItem['icon'],
    href: '/dashboard/surveys' as SubNavItem['href'],
  };

  it('returns plain href when no searchParams or hash', () => {
    expect(getSubItemHref(base)).toBe('/dashboard/surveys');
  });

  it('appends hash when defined', () => {
    expect(getSubItemHref({ ...base, hash: 'section' })).toBe('/dashboard/surveys#section');
  });

  it('appends searchParams as query string', () => {
    expect(getSubItemHref({ ...base, searchParams: { status: 'active' } })).toBe(
      '/dashboard/surveys?status=active'
    );
  });

  it('appends both searchParams and hash', () => {
    expect(getSubItemHref({ ...base, searchParams: { tab: 'all' }, hash: 'top' })).toBe(
      '/dashboard/surveys?tab=all#top'
    );
  });

  it('encodes special characters in searchParams', () => {
    const href = getSubItemHref({ ...base, searchParams: { q: 'hello world' } });

    expect(href).toBe('/dashboard/surveys?q=hello+world');
  });
});

// ── collectSearchParamKeys ──────────────────────────────────────────

describe('collectSearchParamKeys', () => {
  const item = (sp?: Record<string, string>): SubNavItem => ({
    labelKey: 'sidebar.allSurveys' as SubNavItem['labelKey'],
    icon: (() => null) as unknown as SubNavItem['icon'],
    href: '/dashboard/surveys' as SubNavItem['href'],
    searchParams: sp,
  });

  it('returns empty array when no items have searchParams', () => {
    const groups: SubNavGroup[] = [{ items: [item(), item()] }];

    expect(collectSearchParamKeys(groups)).toEqual([]);
  });

  it('collects unique keys from a single group', () => {
    const groups: SubNavGroup[] = [
      { items: [item({ status: 'active' }), item({ status: 'draft', tab: 'all' })] },
    ];

    expect(collectSearchParamKeys(groups)).toEqual(['status', 'tab']);
  });

  it('collects keys across multiple groups', () => {
    const groups: SubNavGroup[] = [
      { items: [item({ status: 'active' })] },
      { items: [item({ view: 'grid' })] },
    ];

    expect(collectSearchParamKeys(groups)).toEqual(['status', 'view']);
  });

  it('deduplicates keys', () => {
    const groups: SubNavGroup[] = [
      { items: [item({ status: 'active' }), item({ status: 'draft' })] },
    ];

    expect(collectSearchParamKeys(groups)).toEqual(['status']);
  });

  it('skips items without searchParams', () => {
    const groups: SubNavGroup[] = [{ items: [item(), item({ status: 'active' })] }];

    expect(collectSearchParamKeys(groups)).toEqual(['status']);
  });
});

// ── isSubItemActive ─────────────────────────────────────────────────

describe('isSubItemActive', () => {
  const item = (overrides?: Partial<SubNavItem>): SubNavItem => ({
    labelKey: 'sidebar.allSurveys' as SubNavItem['labelKey'],
    icon: (() => null) as unknown as SubNavItem['icon'],
    href: '/dashboard/surveys' as SubNavItem['href'],
    ...overrides,
  });

  it('matches hash item when pathname and hash match', () => {
    const result = isSubItemActive(
      item({ hash: 'section' }),
      '/dashboard/surveys',
      'section',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(true);
  });

  it('rejects hash item when hash differs', () => {
    const result = isSubItemActive(
      item({ hash: 'section' }),
      '/dashboard/surveys',
      'other',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(false);
  });

  it('rejects hash item when pathname differs', () => {
    const result = isSubItemActive(
      item({ hash: 'section' }),
      '/settings',
      'section',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(false);
  });

  it('matches searchParams item when all params match', () => {
    const result = isSubItemActive(
      item({ searchParams: { status: 'active' } }),
      '/dashboard/surveys',
      '',
      new URLSearchParams('status=active'),
      ['status']
    );

    expect(result).toBe(true);
  });

  it('rejects searchParams item when param value differs', () => {
    const result = isSubItemActive(
      item({ searchParams: { status: 'active' } }),
      '/dashboard/surveys',
      '',
      new URLSearchParams('status=draft'),
      ['status']
    );

    expect(result).toBe(false);
  });

  it('rejects searchParams item when pathname differs', () => {
    const result = isSubItemActive(
      item({ searchParams: { status: 'active' } }),
      '/other',
      '',
      new URLSearchParams('status=active'),
      ['status']
    );

    expect(result).toBe(false);
  });

  it('matches plain item when pathname matches and no search params present', () => {
    const result = isSubItemActive(item(), '/dashboard/surveys', '', new URLSearchParams(), [
      'status',
    ]);

    expect(result).toBe(true);
  });

  it('rejects plain item when a tracked search param is present in URL', () => {
    const result = isSubItemActive(
      item(),
      '/dashboard/surveys',
      '',
      new URLSearchParams('status=active'),
      ['status']
    );

    expect(result).toBe(false);
  });

  it('matches alsoActiveFor paths', () => {
    const result = isSubItemActive(
      item({ alsoActiveFor: ['/alt-path'] }),
      '/alt-path',
      '',
      new URLSearchParams(),
      []
    );

    expect(result).toBe(true);
  });

  it('returns false when nothing matches', () => {
    const result = isSubItemActive(item(), '/other', '', new URLSearchParams(), []);

    expect(result).toBe(false);
  });
});
