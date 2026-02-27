// @vitest-environment jsdom
/** Tests for the useProjectSelection wrapper that maps useItemSelection to project-specific fields. */
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';

import { useProjectSelection } from './use-project-selection';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard/projects',
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams('selected=proj-1'),
}));

const mockGetProject = vi.fn();

vi.mock('@/features/projects/actions/get-project', () => ({
  getProject: (id: string) => mockGetProject(id),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const PROJECTS: ProjectWithMetrics[] = [
  {
    id: 'proj-1',
    name: 'Project One',
    summary: null,
    description: null,
    image_url: null,
    status: 'active',
    user_id: 'user-1',
    target_responses: 0,
    archived_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    notes_json: null,
    surveyCount: 2,
    activeSurveyCount: 1,
    responseCount: 10,
  },
];

describe('useProjectSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetProject.mockResolvedValue({
      project: PROJECTS[0],
      surveys: [],
    });
  });

  it('should map selectedItem to selectedProject', async () => {
    const { result } = renderHook(() => useProjectSelection(PROJECTS));

    await waitFor(() => {
      expect(result.current.selectedProject?.id).toBe('proj-1');
      expect(result.current.selectedProject?.name).toBe('Project One');
    });
  });

  it('should map detailData to projectDetail', async () => {
    const { result } = renderHook(() => useProjectSelection(PROJECTS));

    await waitFor(() => {
      expect(result.current.projectDetail).toEqual({
        project: PROJECTS[0],
        surveys: [],
      });
    });
  });

  it('should call getProject with the selected ID', async () => {
    renderHook(() => useProjectSelection(PROJECTS));

    await waitFor(() => {
      expect(mockGetProject).toHaveBeenCalledWith('proj-1');
    });
  });
});
