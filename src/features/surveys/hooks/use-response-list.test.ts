// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_RESPONSE_FILTERS } from '@/features/surveys/types/response-list';

import { useResponseList } from './use-response-list';

vi.mock('@/features/surveys/actions/get-survey-responses', () => ({
  getSurveyResponses: vi
    .fn()
    .mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }),
}));

// ── useResponseList ─────────────────────────────────────────────────

describe('useResponseList', () => {
  it('starts with empty items and default filters', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.filters).toEqual(DEFAULT_RESPONSE_FILTERS);
  });

  it('updates status filter and resets page to 1', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setStatus('completed'));

    expect(result.current.filters.status).toBe('completed');
    expect(result.current.filters.page).toBe(1);
  });

  it('updates device filter', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setDevice('mobile'));

    expect(result.current.filters.device).toBe('mobile');
  });

  it('updates hasContact filter', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setHasContact(true));

    expect(result.current.filters.hasContact).toBe(true);
  });

  it('updates date range and resets page to 1', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setDateRange('2025-01-01', '2025-01-31'));

    expect(result.current.filters.dateFrom).toBe('2025-01-01');
    expect(result.current.filters.dateTo).toBe('2025-01-31');
    expect(result.current.filters.page).toBe(1);
  });

  it('updates sort and resets page to 1', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setSort('started_at', 'asc'));

    expect(result.current.filters.sortBy).toBe('started_at');
    expect(result.current.filters.sortDir).toBe('asc');
    expect(result.current.filters.page).toBe(1);
  });

  it('updates page', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setPage(3));

    expect(result.current.filters.page).toBe(3);
  });

  it('updates perPage and resets page to 1', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setPerPage(25));

    expect(result.current.filters.perPage).toBe(25);
    expect(result.current.filters.page).toBe(1);
  });

  it('clearFilters resets to defaults', () => {
    const { result } = renderHook(() => useResponseList({ surveyId: 's1' }));

    act(() => result.current.setStatus('completed'));
    act(() => result.current.setDevice('mobile'));
    act(() => result.current.clearFilters());

    expect(result.current.filters).toEqual(DEFAULT_RESPONSE_FILTERS);
  });
});
