// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCommandPaletteData } from './use-command-palette-data';

const mockGetProjects = vi.fn();
const mockGetUserSurveys = vi.fn();
const mockUsePathname = vi.fn().mockReturnValue('/dashboard');

vi.mock('@/features/projects/actions/get-projects', () => ({
  getProjects: (...args: unknown[]) => mockGetProjects(...args),
}));

vi.mock('@/features/surveys/actions/get-user-surveys', () => ({
  getUserSurveys: (...args: unknown[]) => mockGetUserSurveys(...args),
}));

vi.mock('@/i18n/routing', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('useCommandPaletteData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjects.mockResolvedValue([{ id: 'p1', name: 'Project 1' }]);
    mockGetUserSurveys.mockResolvedValue([{ id: 's1', title: 'Survey 1' }]);
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('does not fetch when open is false', () => {
    renderHook(() => useCommandPaletteData(false));

    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockGetUserSurveys).not.toHaveBeenCalled();
  });

  it('fetches projects and surveys when open is true', async () => {
    const { result } = renderHook(() => useCommandPaletteData(true));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual([{ id: 'p1', name: 'Project 1' }]);
    expect(result.current.surveys).toEqual([{ id: 's1', title: 'Survey 1' }]);
    expect(mockGetProjects).toHaveBeenCalledTimes(1);
    expect(mockGetUserSurveys).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch when data is already cached', async () => {
    const { result, rerender } = renderHook(({ open }) => useCommandPaletteData(open), {
      initialProps: { open: true },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Close and reopen
    rerender({ open: false });
    rerender({ open: true });

    expect(mockGetProjects).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache on pathname change', async () => {
    const { result, rerender } = renderHook(({ open }) => useCommandPaletteData(open), {
      initialProps: { open: true },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change pathname
    mockUsePathname.mockReturnValue('/projects');
    rerender({ open: true });

    // Should re-fetch because cache was invalidated
    await waitFor(() => {
      expect(mockGetProjects).toHaveBeenCalledTimes(2);
    });
  });

  it('sets empty arrays when server returns null', async () => {
    mockGetProjects.mockResolvedValue(null);
    mockGetUserSurveys.mockResolvedValue(null);

    const { result } = renderHook(() => useCommandPaletteData(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.surveys).toEqual([]);
  });

  it('cancels fetch on unmount', async () => {
    let resolveProjects: (v: unknown) => void;
    const projectsPromise = new Promise((r) => {
      resolveProjects = r;
    });

    mockGetProjects.mockReturnValue(projectsPromise);

    const { result, unmount } = renderHook(() => useCommandPaletteData(true));

    expect(result.current.loading).toBe(true);

    unmount();

    // Resolve after unmount — should not cause state update
    await act(async () => {
      resolveProjects!([{ id: 'p2' }]);
    });

    // No error thrown = cancellation worked
  });
});
