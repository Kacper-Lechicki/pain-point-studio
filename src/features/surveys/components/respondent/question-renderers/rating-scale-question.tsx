'use client';

import { useTranslations } from 'next-intl';

import { getRatingScaleConfig } from '@/features/surveys/lib/rating-scale';
import { cn } from '@/lib/common/utils';

interface RatingScaleQuestionProps {
  value: number | null;
  config: Record<string, unknown>;
  onChange: (value: { rating: number }) => void;
}

export const RatingScaleQuestion = ({ value, config, onChange }: RatingScaleQuestionProps) => {
  const t = useTranslations();
  const { values, minLabel, maxLabel } = getRatingScaleConfig(config);
  const max = values[values.length - 1] ?? 0;

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={t('respondent.questions.ratingScale')}
        className="flex flex-wrap gap-2"
      >
        {values.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t('respondent.questions.ratingLabel', { value: n, max })}
            onClick={() => onChange({ rating: n })}
            className={cn(
              'flex min-h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors md:min-h-9 md:min-w-9',
              value === n
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground hover:bg-muted/50'
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="text-muted-foreground mt-2 flex justify-between text-xs">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
};
