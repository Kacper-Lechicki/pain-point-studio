'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import type { QuestionStats } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

const VIOLET_SHADES = [
  'bg-violet-400',
  'bg-violet-500',
  'bg-violet-600',
  'bg-violet-700',
  'bg-violet-800',
  'bg-violet-900',
];

interface OverviewCompletionFunnelProps {
  totalResponses: number;
  completedResponses: number;
  questions: QuestionStats[];
}

export function OverviewCompletionFunnel({
  totalResponses,
  completedResponses,
  questions,
}: OverviewCompletionFunnelProps) {
  const t = useTranslations();

  const steps = useMemo(() => {
    const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);

    const questionSteps = sorted.map((q, i) => ({
      label: t('surveys.stats.overview.funnelQuestion' as MessageKey, { number: i + 1 }),
      count: q.answers.filter((a) => a.completedAt !== null).length,
      color: VIOLET_SHADES[Math.min(i + 1, VIOLET_SHADES.length - 1)],
    }));

    return [
      {
        label: t('surveys.stats.overview.funnelStarted' as MessageKey),
        count: totalResponses,
        color: VIOLET_SHADES[0],
      },
      ...questionSteps,
      {
        label: t('surveys.stats.overview.funnelCompleted' as MessageKey),
        count: completedResponses,
        color: 'bg-emerald-500',
      },
    ];
  }, [questions, totalResponses, completedResponses, t]);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-0 flex-col gap-2 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {t('surveys.stats.overview.funnel' as MessageKey)}
        </p>

        <div className="mt-1 flex flex-col gap-1.5">
          {steps.map((step) => {
            const pct = totalResponses > 0 ? Math.round((step.count / totalResponses) * 100) : 0;
            const widthPct = Math.max(pct, 2);

            return (
              <div key={step.label} className="flex items-center gap-2">
                <span className="text-muted-foreground w-20 shrink-0 truncate text-xs sm:w-24">
                  {step.label}
                </span>
                <div className="bg-muted/50 relative h-6 flex-1 overflow-hidden rounded">
                  <div
                    className={`${step.color} flex h-full items-center justify-between rounded px-2 transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  >
                    {pct >= 15 && (
                      <>
                        <span className="text-[10px] font-semibold text-white tabular-nums">
                          {step.count}
                        </span>
                        <span className="text-[10px] text-white/70 tabular-nums">{pct}%</span>
                      </>
                    )}
                  </div>

                  {pct < 15 && (
                    <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2">
                      <span className="text-muted-foreground text-[10px] font-semibold tabular-nums">
                        {step.count}
                      </span>
                      <span className="text-muted-foreground/60 text-[10px] tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
