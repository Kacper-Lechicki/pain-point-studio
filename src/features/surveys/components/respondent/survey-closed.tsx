'use client';

import { Ban, CalendarClock, CheckCircle2, Clock, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageTransition } from '@/components/ui/page-transition';

interface SurveyClosedProps {
  title: string;
  reason?: 'closed' | 'expired' | 'max_reached' | 'not_started' | 'cancelled';
}

const reasonIcons = {
  closed: CheckCircle2,
  expired: Clock,
  max_reached: Users,
  not_started: CalendarClock,
  cancelled: Ban,
} as const;

const reasonKeys = {
  closed: 'closed',
  expired: 'expired',
  max_reached: 'maxReached',
  not_started: 'notStarted',
  cancelled: 'cancelled',
} as const;

export const SurveyClosed = ({ title, reason = 'closed' }: SurveyClosedProps) => {
  const t = useTranslations('respondent.closed');
  const Icon = reasonIcons[reason];

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-16 text-center">
        <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground size-8" />
        </div>
        <h1 className="text-foreground mb-2 text-xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">{t(reasonKeys[reason])}</p>
        <p className="text-muted-foreground text-xs">{title}</p>
      </div>
    </PageTransition>
  );
};
