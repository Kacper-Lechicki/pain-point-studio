'use client';

import { getRatingScaleConfig } from '@/features/surveys/lib/rating-scale';
import { cn } from '@/lib/common/utils';

interface RatingScaleEditorProps {
  config: Record<string, unknown>;
}

export function RatingScaleEditor({ config }: RatingScaleEditorProps) {
  const { values, minLabel, maxLabel } = getRatingScaleConfig(config);
  const count = values.length;
  const textClass = count <= 5 ? 'text-sm' : count <= 10 ? 'text-xs' : 'text-[10px]';

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            disabled
            className={cn(
              'border-border text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full border font-medium opacity-60 transition-colors md:size-12',
              'cursor-default',
              textClass
            )}
          >
            {value}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex w-full justify-between gap-2">
          <span className="text-muted-foreground shrink-0 text-xs">{minLabel}</span>
          <span className="text-muted-foreground shrink-0 text-right text-xs">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
