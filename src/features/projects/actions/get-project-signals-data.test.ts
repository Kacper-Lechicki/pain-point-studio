// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TEST_PROJECT_ID as PROJECT_ID,
  TEST_SURVEY_ID as SURVEY_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const QUESTION_ID = '00000000-0000-4000-8000-000000000050';
const RESPONSE_ID = '00000000-0000-4000-8000-000000000060';

const MOCK_SURVEYS = [
  { id: SURVEY_ID, title: 'Survey A', research_phase: 'discovery', status: 'completed' },
];

const MOCK_QUESTIONS = [
  { id: QUESTION_ID, survey_id: SURVEY_ID, text: 'Do you like it?', type: 'yes_no', config: {} },
];

const MOCK_RESPONSES = [{ id: RESPONSE_ID, survey_id: SURVEY_ID, status: 'completed' }];

const MOCK_ANSWERS = [{ question_id: QUESTION_ID, value: { answer: 'yes' } }];

describe('Project Actions – Get Project Signals Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return assembled signal data', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: MOCK_SURVEYS }))
      .mockReturnValueOnce(chain({ data: MOCK_QUESTIONS }))
      .mockReturnValueOnce(chain({ data: MOCK_RESPONSES }))
      .mockReturnValueOnce(chain({ data: MOCK_ANSWERS }));

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([
      {
        surveyId: SURVEY_ID,
        surveyTitle: 'Survey A',
        researchPhase: 'discovery',
        totalResponses: 1,
        completedResponses: 1,
        questions: [
          {
            id: QUESTION_ID,
            text: 'Do you like it?',
            type: 'yes_no',
            config: {},
            answers: [{ value: { answer: 'yes' } }],
          },
        ],
      },
    ]);

    expect(mockFrom).toHaveBeenCalledWith('surveys');
    expect(mockFrom).toHaveBeenCalledWith('survey_questions');
    expect(mockFrom).toHaveBeenCalledWith('survey_responses');
    expect(mockFrom).toHaveBeenCalledWith('survey_answers');
  });

  it('should return empty array when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return empty array on surveys query error', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: 'Query failed' } }));

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([]);
  });

  it('should return empty array when no surveys match', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [] }));

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([]);
  });

  it('should return empty array on questions query error', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: MOCK_SURVEYS }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'Query failed' } }));

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([]);
  });

  it('should return empty array on responses query error', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: MOCK_SURVEYS }))
      .mockReturnValueOnce(chain({ data: MOCK_QUESTIONS }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'Query failed' } }));

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([]);
  });

  it('should handle surveys with no responses', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: MOCK_SURVEYS }))
      .mockReturnValueOnce(chain({ data: MOCK_QUESTIONS }))
      .mockReturnValueOnce(chain({ data: [] }));

    const { getProjectSignalsData } = await import('./get-project-signals-data');
    const result = await getProjectSignalsData(PROJECT_ID);

    expect(result).toEqual([
      {
        surveyId: SURVEY_ID,
        surveyTitle: 'Survey A',
        researchPhase: 'discovery',
        totalResponses: 0,
        completedResponses: 0,
        questions: [
          {
            id: QUESTION_ID,
            text: 'Do you like it?',
            type: 'yes_no',
            config: {},
            answers: [],
          },
        ],
      },
    ]);

    expect(mockFrom).toHaveBeenCalledTimes(3);
  });
});
