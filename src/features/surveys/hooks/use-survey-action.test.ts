/** Tests for the isConfirmable helper that determines which survey actions require confirmation. */
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

describe('isConfirmable', () => {
  it('should return true for complete', () => {
    expect(isConfirmable('complete' as SurveyAction)).toBe(true);
  });

  it('should return true for cancel', () => {
    expect(isConfirmable('cancel' as SurveyAction)).toBe(true);
  });

  it('should return true for archive', () => {
    expect(isConfirmable('archive' as SurveyAction)).toBe(true);
  });

  it('should return true for restore', () => {
    expect(isConfirmable('restore' as SurveyAction)).toBe(true);
  });

  it('should return true for delete', () => {
    expect(isConfirmable('delete' as SurveyAction)).toBe(true);
  });
});
