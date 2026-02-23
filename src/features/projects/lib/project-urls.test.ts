/** Tests for project URL builder functions. */
import { describe, expect, it } from 'vitest';

import { getProjectDetailUrl } from './project-urls';

// ── getProjectDetailUrl ────────────────────────────────────────────

describe('getProjectDetailUrl', () => {
  it('should return the detail URL for a given project ID', () => {
    expect(getProjectDetailUrl('abc-123')).toBe('/dashboard/projects/abc-123');
  });
});
