/** Tests for the isConfirmable helper that determines which survey actions require confirmation. */
import { describe, expect, it, vi } from 'vitest';

import type { SurveyAction } from '@/features/surveys/config/survey-status';

import { isConfirmable } from './use-survey-action';

vi.mock('@/features/surveys/actions', () => ({
  archiveSurvey: vi.fn(),
  cancelSurvey: vi.fn(),
  completeSurvey: vi.fn(),
  permanentDeleteSurvey: vi.fn(),
  reopenSurvey: vi.fn(),
  restoreSurvey: vi.fn(),
  restoreTrashSurvey: vi.fn(),
  trashSurvey: vi.fn(),
}));

describe('isConfirmable', () => {
  it('should return true for complete', () => {
    expect(isConfirmable('complete' as SurveyAction)).toBe(true);
  });

  it('should return true for cancel', () => {
    expect(isConfirmable('cancel' as SurveyAction)).toBe(true);
  });

  it('should return true for reopen', () => {
    expect(isConfirmable('reopen' as SurveyAction)).toBe(true);
  });

  it('should return true for archive', () => {
    expect(isConfirmable('archive' as SurveyAction)).toBe(true);
  });

  it('should return true for restore', () => {
    expect(isConfirmable('restore' as SurveyAction)).toBe(true);
  });

  it('should return true for trash', () => {
    expect(isConfirmable('trash' as SurveyAction)).toBe(true);
  });

  it('should return true for restoreTrash', () => {
    expect(isConfirmable('restoreTrash' as SurveyAction)).toBe(true);
  });

  it('should return true for permanentDelete', () => {
    expect(isConfirmable('permanentDelete' as SurveyAction)).toBe(true);
  });
});
