'use client';

import { CheckCircle, Eye, MousePointerClick, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { calculateSubmissionRate, formatCompletionTime } from '@/features/surveys/lib/calculations';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

function getCompletionColor(rate: number | null): string {
  if (rate == null) {
    return 'text-muted-foreground';
  }

  if (rate >= 70) {
    return 'text-emerald-500';
  }

  if (rate >= 40) {
    return 'text-amber-500';
  }

  return 'text-red-500';
}

interface OverviewKpiCardsProps {
  viewCount: number;
  totalResponses: number;
  completedResponses: number;
  maxRespondents: number | null;
  avgCompletionSeconds: number | null;
}

export function OverviewKpiCards({
  viewCount,
  totalResponses,
  completedResponses,
  maxRespondents,
  avgCompletionSeconds,
}: OverviewKpiCardsProps) {
  const t = useTranslations();

  const completionRate = calculateSubmissionRate(completedResponses, totalResponses);
  const timeDisplay = formatCompletionTime(avgCompletionSeconds) ?? '—';

  const cards = [
    {
      value: viewCount,
      label: t('surveys.stats.overview.views' as MessageKey),
      icon: Eye,
      color: 'text-chart-violet',
    },
    {
      value: maxRespondents != null ? `${totalResponses}` : totalResponses,
      suffix:
        maxRespondents != null
          ? t('surveys.stats.overview.ofMax' as MessageKey, { max: maxRespondents })
          : undefined,
      label: t('surveys.stats.overview.responses' as MessageKey),
      icon: MousePointerClick,
      color: 'text-chart-cyan',
    },
    {
      value: completionRate != null ? `${completionRate}%` : '—',
      label: t('surveys.stats.overview.completion' as MessageKey),
      icon: CheckCircle,
      color: getCompletionColor(completionRate),
    },
    {
      value: timeDisplay,
      label: t('surveys.stats.overview.avgTime' as MessageKey),
      icon: Timer,
      color: 'text-chart-pink',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="border-border/50 bg-card rounded-lg border px-3 py-2.5">
          <div className={cn('text-foreground text-lg leading-none font-semibold tabular-nums')}>
            {card.value}
            {card.suffix && (
              <span className="text-muted-foreground text-xs font-normal"> {card.suffix}</span>
            )}
          </div>

          <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
            <card.icon className={cn('mt-0.5 size-3 shrink-0', card.color)} aria-hidden />
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
