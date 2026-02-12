/** @see QuestionType in types/index.ts */
type QuestionType = 'open_text' | 'short_text' | 'multiple_choice' | 'rating_scale' | 'yes_no';

const DEFAULTS: Record<QuestionType, Record<string, unknown>> = {
  multiple_choice: { options: ['', ''], allowOther: false },
  rating_scale: { min: 1, max: 5, minLabel: '', maxLabel: '' },
  open_text: {},
  short_text: {},
  yes_no: {},
};

export const getDefaultConfig = (type: QuestionType): Record<string, unknown> => ({
  ...DEFAULTS[type],
});
