// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { RESEARCH_PHASES } from './research';

// ── RESEARCH_PHASES ─────────────────────────────────────────────────

describe('RESEARCH_PHASES', () => {
  it('contains the correct phases in order', () => {
    expect(RESEARCH_PHASES).toEqual(['idea', 'research', 'validation', 'decision']);
  });

  it('has exactly 4 phases', () => {
    expect(RESEARCH_PHASES).toHaveLength(4);
  });
});
