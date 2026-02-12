'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { SurveyStatus } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

const STATUS_STYLES: Record<SurveyStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  draft: '',
  closed: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  archived: 'opacity-60',
};

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
}

export const SurveyStatusBadge = ({ status }: SurveyStatusBadgeProps) => {
  const t = useTranslations('surveys.dashboard.status');

  return (
    <Badge variant="secondary" className={cn(STATUS_STYLES[status])}>
      {t(status)}
    </Badge>
  );
};
