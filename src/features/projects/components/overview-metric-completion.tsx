'use client';

import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import type { CompletionBreakdown } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

// ── Radial progress ring ────────────────────────────────────────────

const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getCompletionColor(pct: number): string {
  if (pct >= 70) {
    return 'var(--color-chart-emerald, #10b981)';
  }

  if (pct >= 40) {
    return 'var(--color-chart-amber, #f59e0b)';
  }

  return 'var(--color-chart-rose, #f43f5e)';
}

function RadialProgress({ percent }: { percent: number }) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(percent, 100) / 100);
  const color = getCompletionColor(percent);

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      aria-hidden
      className="shrink-0"
    >
      {/* Background ring */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--border)"
        strokeWidth={RING_STROKE}
      />
      {/* Progress ring */}
      {percent > 0 && (
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          className="transition-all duration-500"
        />
      )}
      {/* Center text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-sm font-semibold"
      >
        {percent}%
      </text>
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────────

interface OverviewMetricCompletionProps {
  avgCompletion: number;
  breakdown: CompletionBreakdown;
}

export function OverviewMetricCompletion({
  avgCompletion,
  breakdown,
}: OverviewMetricCompletionProps) {
  const t = useTranslations();
  const total = breakdown.completed + breakdown.inProgress + breakdown.abandoned;

  return (
    <Card className="gap-0 px-4 py-4 shadow-none">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {t('projects.overview.completion' as MessageKey)}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <RadialProgress percent={avgCompletion} />

        <div>
          <p className="text-foreground text-2xl font-semibold tabular-nums">{avgCompletion}%</p>
          {total > 0 ? (
            <p className="text-muted-foreground text-xs">
              {t('projects.overview.completionSub' as MessageKey, {
                completed: breakdown.completed,
                total,
              })}
            </p>
          ) : (
            <span className="text-muted-foreground text-xs">&mdash;</span>
          )}
        </div>
      </div>
    </Card>
  );
}
