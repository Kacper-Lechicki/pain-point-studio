import { AlignLeft, ListChecks, Star, ToggleLeft, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { QuestionType } from '@/features/surveys/types';

// ── Unified question type config ────────────────────────────────────

/** Visual and default config for a single question type. */
interface QuestionTypeConfig {
  icon: LucideIcon;
  labelKey: string;
  defaultConfig: Record<string, unknown>;
}

/** Maps each question type to its icon, i18n label key, and default config. */
const QUESTION_TYPE_CONFIG: Record<QuestionType, QuestionTypeConfig> = {
  open_text: {
    icon: AlignLeft,
    labelKey: 'surveys.builder.types.openText',
    defaultConfig: {},
  },
  short_text: {
    icon: Type,
    labelKey: 'surveys.builder.types.shortText',
    defaultConfig: {},
  },
  multiple_choice: {
    icon: ListChecks,
    labelKey: 'surveys.builder.types.multipleChoice',
    defaultConfig: { options: ['', ''], allowOther: false },
  },
  rating_scale: {
    icon: Star,
    labelKey: 'surveys.builder.types.ratingScale',
    defaultConfig: { min: 1, max: 5, minLabel: '', maxLabel: '' },
  },
  yes_no: {
    icon: ToggleLeft,
    labelKey: 'surveys.builder.types.yesNo',
    defaultConfig: {},
  },
};

// ── Derived maps (backward-compatible) ──────────────────────────────

export const QUESTION_TYPE_ICONS: Record<QuestionType, LucideIcon> = Object.fromEntries(
  Object.entries(QUESTION_TYPE_CONFIG).map(([k, v]) => [k, v.icon])
) as Record<QuestionType, LucideIcon>;

export const QUESTION_TYPE_LABEL_KEYS: Record<QuestionType, string> = Object.fromEntries(
  Object.entries(QUESTION_TYPE_CONFIG).map(([k, v]) => [k, v.labelKey])
) as Record<QuestionType, string>;

// ── Utilities ───────────────────────────────────────────────────────

/** Returns a shallow copy of the default config for a given question type. */
export const getDefaultConfig = (type: QuestionType): Record<string, unknown> => ({
  ...QUESTION_TYPE_CONFIG[type].defaultConfig,
});
