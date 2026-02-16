import { describe, expect, it } from 'vitest';

import {
  CONTENT_NAV_ACTIVE,
  CONTENT_NAV_INACTIVE,
  CONTENT_NAV_ITEM_BASE,
  CONTENT_NAV_ITEM_CLASSES,
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_INACTIVE,
  SIDEBAR_NAV_ITEM_BASE,
  SIDEBAR_NAV_ITEM_CLASSES,
} from './nav-styles';

// ── Sidebar nav ──────────────────────────────────────────────────────

describe('SIDEBAR_NAV_ACTIVE', () => {
  // Contains sidebar primary active token.
  it('contains sidebar primary active token', () => {
    expect(SIDEBAR_NAV_ACTIVE).toContain('sidebar-primary-active');
  });
});

describe('SIDEBAR_NAV_INACTIVE', () => {
  // Contains hover styles for sidebar.
  it('contains hover styles for sidebar', () => {
    expect(SIDEBAR_NAV_INACTIVE).toContain('sidebar-foreground');
  });
});

describe('SIDEBAR_NAV_ITEM_BASE', () => {
  // Contains rounded-lg and flex layout.
  it('contains rounded-lg and base layout classes', () => {
    expect(SIDEBAR_NAV_ITEM_BASE).toContain('rounded-lg');
    expect(SIDEBAR_NAV_ITEM_BASE).toContain('flex');
  });
});

describe('SIDEBAR_NAV_ITEM_CLASSES', () => {
  // Includes data-state active and inactive variants.
  it('includes data-state active and inactive variants', () => {
    expect(SIDEBAR_NAV_ITEM_CLASSES).toContain('data-[state=active]');
    expect(SIDEBAR_NAV_ITEM_CLASSES).toContain('data-[state=inactive]');
  });
});

// ── Content nav ──────────────────────────────────────────────────────

describe('CONTENT_NAV_ACTIVE', () => {
  // Contains bg-accent and text-foreground.
  it('contains accent and foreground', () => {
    expect(CONTENT_NAV_ACTIVE).toContain('bg-accent');
    expect(CONTENT_NAV_ACTIVE).toContain('text-foreground');
  });
});

describe('CONTENT_NAV_INACTIVE', () => {
  // Contains hover text style.
  it('contains hover styles', () => {
    expect(CONTENT_NAV_INACTIVE).toContain('md:hover:text-foreground');
  });
});

describe('CONTENT_NAV_ITEM_BASE', () => {
  // Contains rounded-lg and muted-foreground.
  it('contains rounded-lg and muted-foreground', () => {
    expect(CONTENT_NAV_ITEM_BASE).toContain('rounded-lg');
    expect(CONTENT_NAV_ITEM_BASE).toContain('text-muted-foreground');
  });
});

describe('CONTENT_NAV_ITEM_CLASSES', () => {
  // Includes data-state and bg-accent for content region.
  it('includes data-state variants for content region', () => {
    expect(CONTENT_NAV_ITEM_CLASSES).toContain('data-[state=active]');
    expect(CONTENT_NAV_ITEM_CLASSES).toContain('bg-accent');
  });
});
