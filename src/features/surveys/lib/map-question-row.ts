/** Question type union — mirrors `QuestionType` from `../types` without creating a circular import. */
type QuestionType = 'open_text' | 'short_text' | 'multiple_choice' | 'rating_scale' | 'yes_no';

/** Raw row shape returned by Supabase from `survey_questions` table. */
interface QuestionRow {
  id: string;
  text: string;
  type: string;
  required: boolean;
  description: string | null;
  config: unknown;
  sort_order: number;
}

/** Typed question with camelCase keys, used throughout the app. */
export interface MappedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  description: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
}

export function mapQuestionRow(row: QuestionRow): MappedQuestion {
  return {
    id: row.id,
    text: row.text,
    type: row.type as QuestionType,
    required: row.required,
    description: row.description,
    config: (row.config as Record<string, unknown>) ?? {},
    sortOrder: row.sort_order,
  };
}
