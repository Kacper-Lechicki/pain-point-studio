'use client';

import { cn } from '@/lib/common/utils';

interface RatingScaleEditorProps {
  config: Record<string, unknown>;
}

export function RatingScaleEditor({ config }: RatingScaleEditorProps) {
  const min = (config.min as number) ?? 1;
  const max = (config.max as number) ?? 5;
  const minLabel = (config.minLabel as string) ?? '';
  const maxLabel = (config.maxLabel as string) ?? '';

  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

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
