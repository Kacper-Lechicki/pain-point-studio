'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { getStatusBadgeProps } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface PhaseSurveyCardProps {
  survey: ProjectSurvey;
  href: string;
}

export function PhaseSurveyCard({ survey, href }: PhaseSurveyCardProps) {
  const t = useTranslations();
  const format = useFormatter();
  const { variant, className: badgeClass } = getStatusBadgeProps(survey.status as SurveyStatus);
  const createdLabel = format.relativeTime(new Date(survey.createdAt), new Date());

  return (
    <Link
      href={href}
      className={cn(
        'border-border/50 flex min-w-0 flex-col gap-2 rounded-lg border border-dashed p-3 transition-colors',
        'hover:bg-muted/50 focus-visible:ring-ring/20 focus-visible:ring-2 focus-visible:outline-none'
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="text-foreground min-w-0 truncate text-sm font-medium">{survey.title}</span>

        <Badge variant={variant} className={cn('shrink-0 text-[11px]', badgeClass)}>
          {t(`surveys.dashboard.status.${survey.status}` as MessageKey)}
        </Badge>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span>{t('projects.detail.responses', { count: survey.responseCount })}</span>
        <span className="text-border">·</span>
        <span>{createdLabel}</span>
      </div>
    </Link>
  );
}
