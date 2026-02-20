// @vitest-environment jsdom
/** useSurveyCardActions: share URL computation and dialog state management. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSurveyCardActions } from './use-survey-card-actions';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

vi.mock('@/features/surveys/lib/share-url', () => ({
  getSurveyShareUrl: (locale: string, slug: string) => `https://example.com/${locale}/r/${slug}`,
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('useSurveyCardActions', () => {
  it('should return shareUrl when slug is provided', () => {
    const { result } = renderHook(() => useSurveyCardActions('my-survey'));
    expect(result.current.shareUrl).toBe('https://example.com/en/r/my-survey');
  });

  it('should return null shareUrl when slug is null', () => {
    const { result } = renderHook(() => useSurveyCardActions(null));
    expect(result.current.shareUrl).toBeNull();
  });

  it('should initialise shareDialogOpen to false', () => {
    const { result } = renderHook(() => useSurveyCardActions('my-survey'));
    expect(result.current.shareDialogOpen).toBe(false);
  });

  it('should open share dialog when handleShare is called with a valid slug', () => {
    const { result } = renderHook(() => useSurveyCardActions('my-survey'));

    act(() => {
      result.current.handleShare();
    });

    expect(result.current.shareDialogOpen).toBe(true);
  });

  it('should not open share dialog when slug is null', () => {
    const { result } = renderHook(() => useSurveyCardActions(null));

    act(() => {
      result.current.handleShare();
    });

    expect(result.current.shareDialogOpen).toBe(false);
  });

  it('should allow manual control of shareDialogOpen via setShareDialogOpen', () => {
    const { result } = renderHook(() => useSurveyCardActions('my-survey'));

    act(() => {
      result.current.setShareDialogOpen(true);
    });

    expect(result.current.shareDialogOpen).toBe(true);

    act(() => {
      result.current.setShareDialogOpen(false);
    });

    expect(result.current.shareDialogOpen).toBe(false);
  });
});
