'use client';

import { getRatingScaleConfig } from '@/features/surveys/lib/rating-scale';
import { cn } from '@/lib/common/utils';

interface RatingScaleEditorProps {
  config: Record<string, unknown>;
}

export function RatingScaleEditor({ config }: RatingScaleEditorProps) {
  const { values, minLabel, maxLabel } = getRatingScaleConfig(config);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            disabled
            className={cn(
              'border-border text-muted-foreground flex size-10 items-center justify-center rounded-full border text-sm font-medium opacity-60 transition-colors',
              'cursor-default'
            )}
          >
            {value}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between px-1">
          <span className="text-muted-foreground text-xs">{minLabel}</span>
          <span className="text-muted-foreground text-xs">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
