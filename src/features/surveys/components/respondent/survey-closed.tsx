'use client';

import { Ban, CheckCircle2, Clock, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageTransition } from '@/components/ui/page-transition';
import type { ClosedReason } from '@/features/surveys/types';

interface SurveyClosedProps {
  title: string;
  reason?: ClosedReason;
}

const reasonIcons: Record<ClosedReason, typeof CheckCircle2> = {
  completed: CheckCircle2,
  expired: Clock,
  max_reached: Users,
  cancelled: Ban,
};

const reasonKeys: Record<ClosedReason, string> = {
  completed: 'completed',
  expired: 'expired',
  max_reached: 'maxReached',
  cancelled: 'cancelled',
};

export const SurveyClosed = ({ title, reason = 'completed' }: SurveyClosedProps) => {
  const t = useTranslations('respondent.closed');
  const Icon = reasonIcons[reason];

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-16 text-center">
        <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground size-8" />
        </div>
        <h1 className="text-foreground mb-2 text-xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {t(reasonKeys[reason] as Parameters<typeof t>[0])}
        </p>
        <p className="text-muted-foreground text-xs">{title}</p>
      </div>
    </PageTransition>
  );
};
