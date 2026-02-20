import { useState } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { getSparklineColor } from '@/features/surveys/components/dashboard/sparkline';
import { SURVEY_RETENTION_DAYS } from '@/features/surveys/config';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import { daysUntilExpiry } from '@/features/surveys/lib/calculations';

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
  const { isDraft, isActive, isCompleted, isCancelled, isArchived } = flags;
  const hasShareableLink = (isActive || isCompleted || isCancelled) && !!survey.slug;
  const canExport = !isDraft && !isArchived;
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const handleExport = () => setExportDialogOpen(true);

  const archivedAtLabel =
    isArchived && (survey.archivedAt ?? survey.updatedAt)
      ? format.relativeTime(new Date(survey.archivedAt ?? survey.updatedAt), now)
      : null;

  const sparklineColor = getSparklineColor(survey.recentActivity);
  const updatedAtLabel = format.relativeTime(new Date(survey.updatedAt), now);

  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;

  const availableActions = getAvailableActions(survey.status);

  const autoDeleteDays = isArchived
    ? daysUntilExpiry(survey.archivedAt, SURVEY_RETENTION_DAYS)
    : null;

  const linkExpiryDays = (() => {
    if (isCompleted) {
      return daysUntilExpiry(survey.completedAt, SURVEY_RETENTION_DAYS);
    }

    if (isCancelled) {
      return daysUntilExpiry(survey.cancelledAt, SURVEY_RETENTION_DAYS);
    }

    return null;
  })();

  return {
    t,
    format,
    flags,
    isDraft,
    isActive,
    isCompleted,
    isCancelled,
    isArchived,
    hasShareableLink,
    archivedAtLabel,
    sparklineColor,
    updatedAtLabel,
    lastResponseLabel,
    availableActions,
    autoDeleteDays,
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
