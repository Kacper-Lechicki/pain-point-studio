// @vitest-environment node
/** Tests for fetching the project ID associated with a survey. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TEST_PROJECT_ID as PROJECT_ID,
  TEST_SURVEY_ID as SURVEY_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

// ── Mocks ────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Get Survey Project ID', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return project_id on success', async () => {
    mockFrom.mockReturnValue(chain({ data: { project_id: PROJECT_ID } }));

    const { getSurveyProjectId } = await import('./get-survey-project-id');
    const result = await getSurveyProjectId(SURVEY_ID);

    expect(result).toBe(PROJECT_ID);
    expect(mockFrom).toHaveBeenCalledWith('surveys');
  });

  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getSurveyProjectId } = await import('./get-survey-project-id');
    const result = await getSurveyProjectId(SURVEY_ID);

    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return null when survey not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { getSurveyProjectId } = await import('./get-survey-project-id');
    const result = await getSurveyProjectId(SURVEY_ID);

    expect(result).toBeNull();
  });

  it('should return null when project_id is null', async () => {
    mockFrom.mockReturnValue(chain({ data: { project_id: null } }));

    const { getSurveyProjectId } = await import('./get-survey-project-id');
    const result = await getSurveyProjectId(SURVEY_ID);

    expect(result).toBeNull();
  });
});
