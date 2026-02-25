'use client';

import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import { cn } from '@/lib/common/utils';

const ACCENT_ICON: Record<string, string> = {
  pink: 'text-[var(--chart-pink)]',
  cyan: 'text-[var(--chart-cyan)]',
  violet: 'text-[var(--chart-violet)]',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
};

const ACCENT_BORDER: Record<string, string> = {
  pink: 'border-l-[var(--chart-pink)]',
  cyan: 'border-l-[var(--chart-cyan)]',
  violet: 'border-l-[var(--chart-violet)]',
  emerald: 'border-l-emerald-500',
  rose: 'border-l-rose-500',
};

const SIGNAL_BASE = 'inline-flex items-center gap-1 text-[11px] font-medium tabular-nums';

interface KpiCardProps {
  title: string;
  value: string;
  /** Percentage change vs previous period. Null = no comparison or no data. */
  delta: number | null;
  /** When true and delta is null, show gray "0%" pill (same as no change). */
  showZeroWhenNoData?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'pink' | 'cyan' | 'violet' | 'emerald' | 'rose';
  className?: string;
}

export function KpiCard({
  title,
  value,
  delta,
  showZeroWhenNoData,
  subtitle,
  icon: Icon,
  accent,
  className,
}: KpiCardProps) {
  const hasDelta = delta !== null;
  const deltaUp = hasDelta && delta! > 0;
  const deltaDown = hasDelta && delta! < 0;
  const deltaFlat = hasDelta && delta! === 0;
  const showZeroPill = showZeroWhenNoData && delta === null;

  const showPill = hasDelta || showZeroPill;
  const pillVariant = deltaUp ? 'up' : deltaDown ? 'down' : 'flat';

  return (
    <Card
      className={cn(
        BENTO_CARD_CLASS,
        accent && 'border-l-4',
        accent && ACCENT_BORDER[accent],
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground shrink-0 text-xs font-medium tracking-wider uppercase">
            {title}
          </p>
          <Icon
            className={cn(
              'size-4 shrink-0',
              accent ? ACCENT_ICON[accent] : 'text-muted-foreground/50'
            )}
          />
        </div>

        <div className="mt-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums">{value}</span>
        </div>

        {(subtitle || showPill) && (
          <div className="mt-1.5 flex items-end justify-between gap-2">
            {subtitle ? (
              <p className="text-muted-foreground min-w-0 flex-1 text-xs leading-relaxed">
                {subtitle}
              </p>
            ) : (
              <span />
            )}
            {showPill && (
              <span
                className={cn(
                  SIGNAL_BASE,
                  'shrink-0',
                  pillVariant === 'up' && 'text-emerald-600 dark:text-emerald-400',
                  pillVariant === 'down' && 'text-red-600 dark:text-red-400',
                  (pillVariant === 'flat' || showZeroPill) && 'text-muted-foreground'
                )}
              >
                {deltaUp && <TrendingUp className="size-3 shrink-0" />}
                {deltaDown && <TrendingDown className="size-3 shrink-0" />}
                {(deltaFlat || showZeroPill) && <Minus className="size-3 shrink-0" />}
                {hasDelta ? (delta! > 0 ? `+${delta}%` : delta! < 0 ? `${delta}%` : '0%') : '0%'}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
