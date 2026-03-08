'use client';

import { Eye, Send, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import type { SurveyStats } from '@/features/surveys/actions/get-survey-stats';

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  value: number;
  className?: string;
}

function MetricCard({ icon: Icon, label, subtitle, value, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-foreground text-2xl font-bold tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface OverviewTabProps {
  stats: SurveyStats;
}

export function OverviewTab({ stats }: OverviewTabProps) {
  const t = useTranslations('surveys.stats.metrics');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon={Eye}
        label={t('views')}
        subtitle={t('viewsSubtitle')}
        value={stats.viewCount}
      />
      <MetricCard
        icon={Users}
        label={t('started')}
        subtitle={t('startedSubtitle')}
        value={stats.totalResponses}
      />
      <MetricCard
        icon={Send}
        label={t('responses')}
        subtitle={t('responsesSubtitle')}
        value={stats.completedResponses}
      />
    </div>
  );
}
