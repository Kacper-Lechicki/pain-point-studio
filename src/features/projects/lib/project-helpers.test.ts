import { describe, expect, it } from 'vitest';

import { isProjectArchived } from './project-helpers';

describe('isProjectArchived', () => {
  it('should return true for archived status string', () => {
    expect(isProjectArchived('archived')).toBe(true);
  });

  it('should return false for active status string', () => {
    expect(isProjectArchived('active')).toBe(false);
  });

  it('should return true for an object with archived status', () => {
    expect(isProjectArchived({ status: 'archived' })).toBe(true);
  });

  it('should return false for an object with active status', () => {
    expect(isProjectArchived({ status: 'active' })).toBe(false);
  });
});
