'use client';

import { AlertTriangle, MoreHorizontal } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { Sparkline, getSparklineColor } from '@/features/surveys/components/dashboard/sparkline';
import { SurveyActionMenuContent } from '@/features/surveys/components/dashboard/survey-action-menu';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import {
  NOW_UPDATE_INTERVAL_MS,
  RESPONDENT_LIMIT_WARNING_THRESHOLD,
} from '@/features/surveys/config';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import { calculateSubmissionRate } from '@/features/surveys/lib/calculations';
import { HINT_SEVERITY_STYLES, computeHint } from '@/features/surveys/lib/survey-hints';
import { getSurveyEditUrl, getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

interface SurveyCardProps {
  survey: UserSurvey;
  onStatusChange: (surveyId: string, action: string) => void;
  onQuickPreview?: (surveyId: string) => void;
}

export const SurveyCard = ({ survey, onStatusChange, onQuickPreview }: SurveyCardProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow({ updateInterval: NOW_UPDATE_INTERVAL_MS });

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    survey.slug
  );

  const { isDraft, isActive, isCompleted, isCancelled, isArchived } = deriveSurveyFlags(
    survey.status
  );
  const hasShareableLink = (isActive || isCompleted || isCancelled) && !!survey.slug;
  const href = isDraft ? getSurveyEditUrl(survey.id) : getSurveyStatsUrl(survey.id);

  const hint = computeHint(survey, t);
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const inProgressCount = survey.responseCount - survey.completedCount;
  const relativeUpdated = format.relativeTime(new Date(survey.updatedAt), now);
  const availableActions = getAvailableActions(survey.status);

  const responseDisplay = (() => {
    const parts: string[] = [];

    if (survey.maxRespondents) {
      parts.push(
        t('surveys.dashboard.card.responsesOfMax', {
          completed: survey.completedCount,
          max: survey.maxRespondents,
        })
      );
    } else {
      parts.push(t('surveys.dashboard.card.completedCount', { count: survey.completedCount }));
    }

    if (inProgressCount > 0) {
      parts.push(t('surveys.dashboard.card.inProgressCount', { count: inProgressCount }));
    }

    return parts.join(', ');
  })();

  const submissionRate = !isDraft
    ? calculateSubmissionRate(survey.completedCount, survey.responseCount)
    : null;

  const lastResponseLabel =
    survey.lastResponseAt != null
      ? t('surveys.dashboard.card.lastResponse', {
          time: format.relativeTime(new Date(survey.lastResponseAt), now),
        })
      : null;

  return (
    <>
      <div
        className={cn(
          'bg-card group relative min-w-0 rounded-xl border p-4 shadow-sm transition-[box-shadow,border-color] sm:p-5',
          'hover:border-border/80 hover:shadow-md',
          isArchived && 'opacity-50'
        )}
      >
        <Link href={href} className="block min-w-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-foreground truncate text-sm leading-snug font-semibold">
                  {survey.title}
                </h3>
                <SurveyStatusBadge status={survey.status} />
              </div>

              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs leading-relaxed">
                {survey.description || (
                  <span className="italic">{t('surveys.dashboard.card.noDescription')}</span>
                )}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground shrink-0"
                  aria-label={t('surveys.dashboard.actions.moreActions')}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <SurveyActionMenuContent
                surveyId={survey.id}
                flags={{
                  isDraft,
                  isArchived,
                  hasShareableLink,
                  questionCount: survey.questionCount,
                }}
                availableActions={availableActions}
                onShare={handleShare}
                handleActionClick={handleActionClick}
                {...(onQuickPreview && { onDetails: () => onQuickPreview(survey.id) })}
                detailsLabelKey="quickPreview"
              />
            </DropdownMenu>
          </div>

          <div className="border-border/50 bg-muted/30 mt-3 flex min-w-0 flex-col gap-2 rounded-lg px-2.5 py-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5">
            <div className="text-muted-foreground min-w-0 shrink-0 text-xs leading-relaxed">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="truncate">
                  {t(`surveys.categories.${survey.category}` as Parameters<typeof t>[0])}
                </span>
                <span className="text-border/60 shrink-0" aria-hidden>
                  ·
                </span>
                <span className="shrink-0">
                  {t('surveys.dashboard.card.questions', { count: survey.questionCount })}
                </span>
                <span className="text-border/60 shrink-0" aria-hidden>
                  ·
                </span>
                <span className="shrink-0">{relativeUpdated}</span>
              </div>
              {!isDraft && (
                <div
                  className={cn(
                    'mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 tabular-nums',
                    isActive && 'text-foreground font-medium'
                  )}
                >
                  <span>{responseDisplay}</span>
                  {submissionRate !== null && (
                    <>
                      <span className="text-border/60 shrink-0" aria-hidden>
                        ·
                      </span>
                      <span>
                        {t('surveys.dashboard.card.submissionRate', { rate: submissionRate })}
                      </span>
                    </>
                  )}
                </div>
              )}
              {lastResponseLabel != null && (
                <div className="mt-0.5 truncate">{lastResponseLabel}</div>
              )}
            </div>
            {!isCancelled && (
              <Sparkline data={survey.recentActivity} className={cn('shrink-0', sparklineColor)} />
            )}
          </div>

          {hint &&
            (() => {
              const style = HINT_SEVERITY_STYLES[hint.severity];

              return (
                <div className={cn('mt-2 flex items-center gap-1.5 text-xs', style.className)}>
                  {hint.severity === 'warning' && <AlertTriangle className="size-3 shrink-0" />}
                  {style.dot && <span className={style.dot} />}
                  <span>{hint.text}</span>
                </div>
              );
            })()}

          {isActive && survey.maxRespondents && survey.maxRespondents > 0 && (
            <div className="mt-2.5">
              <div className="bg-muted h-1 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    survey.responseCount / survey.maxRespondents >=
                      RESPONDENT_LIMIT_WARNING_THRESHOLD
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                  style={{
                    width: `${Math.min((survey.responseCount / survey.maxRespondents) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Link>
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
      {hasShareableLink && shareUrl && (
        <SurveyShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareUrl={shareUrl}
          surveyTitle={survey.title}
        />
      )}
    </>
  );
};
