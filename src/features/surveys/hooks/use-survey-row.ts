import { useState } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import { getSparklineColor } from '@/features/surveys/components/dashboard/sparkline';
import { SURVEY_RETENTION_DAYS, TRASH_RETENTION_DAYS } from '@/features/surveys/config';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import type { UserSurvey } from '@/features/surveys/types';
import { daysUntilExpiry } from '@/lib/common/calculations';

export function useSurveyRow(
  survey: UserSurvey,
  now: Date,
  onStatusChange: (surveyId: string, action: string) => void
) {
  const t = useTranslations();
  const format = useFormatter();
  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);

  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    survey.slug
  );

  const flags = deriveSurveyFlags(survey.status);
  const { isDraft, isActive, isCompleted, isTrashed } = flags;
  const hasShareableLink = isActive && !!survey.slug;
  const canExport = !isDraft;
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const handleExport = () => setExportDialogOpen(true);

  const sparklineColor = getSparklineColor(survey.recentActivity);
  const updatedAtLabel = format.relativeTime(new Date(survey.updatedAt), now);

  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;

  const availableActions = getAvailableActions(survey.status);

  const trashedPurgeDays = isTrashed
    ? daysUntilExpiry(survey.deletedAt ?? null, TRASH_RETENTION_DAYS)
    : null;

  const linkExpiryDays = isCompleted
    ? daysUntilExpiry(survey.completedAt, SURVEY_RETENTION_DAYS)
    : null;

  return {
    t,
    format,
    flags,
    isDraft,
    isActive,
    isCompleted,
    isTrashed,
    hasShareableLink,
    sparklineColor,
    updatedAtLabel,
    lastResponseLabel,
    availableActions,
    trashedPurgeDays,
    linkExpiryDays,
    handleActionClick,
    confirmDialogProps,
    shareUrl,
    shareDialogOpen,
    setShareDialogOpen,
    handleShare,
    canExport,
    exportDialogOpen,
    setExportDialogOpen,
    handleExport,
  };
}
