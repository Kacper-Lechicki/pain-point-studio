import { describe, expect, it } from 'vitest';

import { isProjectCompleted, isProjectReadOnly, isProjectTrashed } from './project-helpers';

describe('isProjectCompleted', () => {
  it('should return true for completed status string', () => {
    expect(isProjectCompleted('completed')).toBe(true);
  });

  it('should return false for active status string', () => {
    expect(isProjectCompleted('active')).toBe(false);
  });

  it('should return true for an object with completed status', () => {
    expect(isProjectCompleted({ status: 'completed' })).toBe(true);
  });

  it('should return false for an object with active status', () => {
    expect(isProjectCompleted({ status: 'active' })).toBe(false);
  });
});

describe('isProjectTrashed', () => {
  it('should return true for trashed status string', () => {
    expect(isProjectTrashed('trashed')).toBe(true);
  });

  it('should return false for active status string', () => {
    expect(isProjectTrashed('active')).toBe(false);
  });
});

describe('isProjectReadOnly', () => {
  it('should return true for completed status', () => {
    expect(isProjectReadOnly('completed')).toBe(true);
  });

  it('should return false for active status', () => {
    expect(isProjectReadOnly('active')).toBe(false);
  });
});
