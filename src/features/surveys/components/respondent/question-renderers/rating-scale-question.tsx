'use client';

import { cn } from '@/lib/common/utils';

interface RatingScaleQuestionProps {
  value: number | null;
  config: Record<string, unknown>;
  onChange: (value: { rating: number }) => void;
}

export const RatingScaleQuestion = ({ value, config, onChange }: RatingScaleQuestionProps) => {
  const min = (config.min as number) ?? 1;
  const max = (config.max as number) ?? 5;
  const minLabel = (config.minLabel as string) || '';
  const maxLabel = (config.maxLabel as string) || '';

  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {values.map((n) => (
          <button
            key={n}
            type="button"
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
