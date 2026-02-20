/** Tests for sidebar navigation CSS class constants. */
import { describe, expect, it } from 'vitest';

import {
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_INACTIVE,
  SIDEBAR_NAV_ITEM_BASE,
  SIDEBAR_NAV_ITEM_CLASSES,
} from './nav-styles';

describe('SIDEBAR_NAV_ACTIVE', () => {
  it('should contain sidebar primary active token', () => {
    expect(SIDEBAR_NAV_ACTIVE).toContain('sidebar-primary-active');
  });
});

describe('SIDEBAR_NAV_INACTIVE', () => {
  it('should contain hover styles for sidebar', () => {
    expect(SIDEBAR_NAV_INACTIVE).toContain('sidebar-foreground');
  });
});

describe('SIDEBAR_NAV_ITEM_BASE', () => {
  it('should contain rounded-lg and base layout classes', () => {
    expect(SIDEBAR_NAV_ITEM_BASE).toContain('rounded-lg');
    expect(SIDEBAR_NAV_ITEM_BASE).toContain('flex');
  });
});

describe('SIDEBAR_NAV_ITEM_CLASSES', () => {
  it('should include data-state active and inactive variants', () => {
    expect(SIDEBAR_NAV_ITEM_CLASSES).toContain('data-[state=active]');
    expect(SIDEBAR_NAV_ITEM_CLASSES).toContain('data-[state=inactive]');
  });
});
