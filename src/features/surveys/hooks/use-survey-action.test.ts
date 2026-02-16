import { describe, expect, it, vi } from 'vitest';

import type { SurveyAction } from '@/features/surveys/config/survey-status';

import { isConfirmable } from './use-survey-action';

vi.mock('@/features/surveys/actions', () => ({
  archiveSurvey: vi.fn(),
  cancelSurvey: vi.fn(),
  completeSurvey: vi.fn(),
  deleteSurveyDraft: vi.fn(),
  restoreSurvey: vi.fn(),
}));

// ── isConfirmable ──────────────────────────────────────────────────

describe('isConfirmable', () => {
  it('complete is confirmable', () => {
    expect(isConfirmable('complete' as SurveyAction)).toBe(true);
  });

  it('cancel is confirmable', () => {
    expect(isConfirmable('cancel' as SurveyAction)).toBe(true);
  });

  it('archive is confirmable', () => {
    expect(isConfirmable('archive' as SurveyAction)).toBe(true);
  });

  it('restore is confirmable', () => {
    expect(isConfirmable('restore' as SurveyAction)).toBe(true);
  });

  it('delete is confirmable', () => {
    expect(isConfirmable('delete' as SurveyAction)).toBe(true);
  });
});
