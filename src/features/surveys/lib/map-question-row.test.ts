import { describe, expect, it } from 'vitest';

import { mapQuestionRow } from './map-question-row';

describe('mapQuestionRow', () => {
  it('maps snake_case row to camelCase question', () => {
    const row = {
      id: '123',
      text: 'What do you think?',
      type: 'open_text',
      required: true,
      description: 'Please explain',
      config: { placeholder: 'Type here' },
      sort_order: 0,
    };

    const result = mapQuestionRow(row);

    expect(result).toEqual({
      id: '123',
      text: 'What do you think?',
      type: 'open_text',
      required: true,
      description: 'Please explain',
      config: { placeholder: 'Type here' },
      sortOrder: 0,
    });
  });

  it('defaults config to empty object when null', () => {
    const row = {
      id: '456',
      text: 'Rate us',
      type: 'rating_scale',
      required: false,
      description: null,
      config: null,
      sort_order: 1,
    };

    const result = mapQuestionRow(row);

    expect(result.config).toEqual({});
  });

  it('preserves null description', () => {
    const row = {
      id: '789',
      text: 'Yes or no?',
      type: 'yes_no',
      required: true,
      description: null,
      config: {},
      sort_order: 2,
    };

    const result = mapQuestionRow(row);

    expect(result.description).toBeNull();
  });

  it('casts string type to QuestionType union', () => {
    const row = {
      id: 'abc',
      text: 'Choose one',
      type: 'multiple_choice',
      required: true,
      description: null,
      config: { options: ['A', 'B'] },
      sort_order: 3,
    };

    const result = mapQuestionRow(row);

    expect(result.type).toBe('multiple_choice');
  });
});
