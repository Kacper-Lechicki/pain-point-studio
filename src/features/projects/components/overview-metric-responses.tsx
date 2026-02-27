'use client';

import { useId, useMemo } from 'react';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import type { TimelinePoint } from '@/features/dashboard/types/dashboard-stats';
import type { MessageKey } from '@/i18n/types';

// ── Mini sparkline (SVG) ────────────────────────────────────────────

const SPARK_W = 80;
const SPARK_H = 24;
const SPARK_PAD = 2;

function MiniSparkline({ data }: { data: number[] }) {
  const uniqueId = useId();
  const gradientId = `resp-spark-${uniqueId.replace(/:/g, '')}`;

  const { pathD, areaD, hasData } = useMemo(() => {
    const sum = data.reduce((a, b) => a + b, 0);

    if (sum === 0 || data.length < 2) {
      return { pathD: '', areaD: '', hasData: false };
    }

    const max = Math.max(...data);
    const chartW = SPARK_W - SPARK_PAD * 2;
    const chartH = SPARK_H - SPARK_PAD * 2;
    const step = chartW / (data.length - 1);

    const points = data.map((c, i) => ({
      x: SPARK_PAD + i * step,
      y: SPARK_PAD + chartH - (max > 0 ? (c / max) * chartH : 0),
    }));

    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const last = points[points.length - 1]!;
    const area = `${line} L${last.x.toFixed(1)},${(SPARK_H - SPARK_PAD).toFixed(1)} L${SPARK_PAD.toFixed(1)},${(SPARK_H - SPARK_PAD).toFixed(1)} Z`;

    return { pathD: line, areaD: area, hasData: true };
  }, [data]);

  if (!hasData) {
    return (
      <svg
        width={SPARK_W}
        height={SPARK_H}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        aria-hidden
        className="text-muted-foreground/30"
      >
        <line
          x1={SPARK_PAD}
          y1={SPARK_H / 2}
          x2={SPARK_W - SPARK_PAD}
          y2={SPARK_H / 2}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      </svg>
    );
  }

  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-chart-violet)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--color-chart-violet)" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke="var(--color-chart-violet)" strokeWidth={1.5} />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────────

interface OverviewMetricResponsesProps {
  totalResponses: number;
  timeline: TimelinePoint[];
}

export function OverviewMetricResponses({
  totalResponses,
  timeline,
}: OverviewMetricResponsesProps) {
  const t = useTranslations();

  const { sparklineData, delta } = useMemo(() => {
    const last7 = timeline.slice(-7).map((p) => p.count);
    const prev7 = timeline.slice(-14, -7).map((p) => p.count);
    const sumLast = last7.reduce((a, b) => a + b, 0);
    const sumPrev = prev7.reduce((a, b) => a + b, 0);

    return { sparklineData: last7, delta: sumLast - sumPrev };
  }, [timeline]);

  return (
    <Card className="gap-0 px-4 py-4 shadow-none">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {t('projects.overview.responses' as MessageKey)}
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-foreground text-2xl font-semibold tabular-nums">{totalResponses}</p>

          {delta !== 0 ? (
            <span
              className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${
                delta > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="size-3" aria-hidden />
              ) : (
                <TrendingDown className="size-3" aria-hidden />
              )}
              {delta > 0 ? `+${delta}` : delta}
              <span className="text-muted-foreground ml-0.5 font-normal">
                {t('projects.overview.last7d' as MessageKey)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground mt-1 block text-xs">&mdash;</span>
          )}
        </div>

        <MiniSparkline data={sparklineData} />
      </div>
    </Card>
  );
}
