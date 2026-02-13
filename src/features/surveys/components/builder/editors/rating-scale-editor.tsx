'use client';

import { getRatingScaleConfig } from '@/features/surveys/lib/rating-scale';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { cn } from '@/lib/common/utils';

const COLS_MOBILE = 5;
const COLS_DESKTOP = 10;

interface RatingScaleEditorProps {
  config: Record<string, unknown>;
}

export function RatingScaleEditor({ config }: RatingScaleEditorProps) {
  const isMd = useBreakpoint('md');
  const { values, minLabel, maxLabel } = getRatingScaleConfig(config);
  const count = values.length;
  const cols =
    count <= COLS_MOBILE ? count : isMd && count >= COLS_DESKTOP ? COLS_DESKTOP : COLS_MOBILE;
  const textClass = count <= 5 ? 'text-sm' : count <= 10 ? 'text-xs' : 'text-[10px]';

  return (
    <div className="w-full space-y-2">
      <div
        className="grid w-full gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {values.map((value) => (
          <button
            key={value}
            type="button"
            disabled
            className={cn(
              'border-border text-muted-foreground flex aspect-square w-full min-w-0 items-center justify-center rounded-full border font-medium opacity-60 transition-colors',
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
