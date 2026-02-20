import type { QuestionType } from '@/features/surveys/types';

interface QuestionRow {
  id: string;
  text: string;
  type: string;
  required: boolean;
  description: string | null;
  config: unknown;
  sort_order: number;
}

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
