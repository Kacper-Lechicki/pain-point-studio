'use client';

import { AlertTriangle, BarChart3, Eye, MoreHorizontal, Pencil, Share2 } from 'lucide-react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SURVEY_ACTION_UI, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { calculateCompletionRate } from '@/features/surveys/lib/calculations';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import { computeHint } from '@/features/surveys/lib/survey-hints';
import { getSurveyEditUrl, getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Component ────────────────────────────────────────────────────────

interface SurveyCardProps {
  survey: UserSurvey;
  onStatusChange: (surveyId: string, action: string) => void;
  onQuickPreview?: (surveyId: string) => void;
}

export const SurveyCard = ({ survey, onStatusChange, onQuickPreview }: SurveyCardProps) => {
  const t = useTranslations('surveys.dashboard');
  const tCategories = useTranslations('surveys.categories');
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow();

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);

  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';
  const isArchived = survey.status === 'archived';

  const href = isDraft ? getSurveyEditUrl(survey.id) : getSurveyStatsUrl(survey.id);

  const shareUrl = survey.slug ? getSurveyShareUrl(locale, survey.slug) : null;

  const hint = computeHint(survey, t);
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const inProgressCount = survey.responseCount - survey.completedCount;
  const relativeUpdated = format.relativeTime(new Date(survey.updatedAt), now);
  const availableActions = getAvailableActions(survey.status);

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('toast.linkCopied'));
  };

  const responseDisplay = (() => {
    const parts: string[] = [];

    if (survey.maxRespondents) {
      parts.push(
        t('card.responsesOfMax', { completed: survey.completedCount, max: survey.maxRespondents })
      );
    } else {
      parts.push(t('card.completedCount', { count: survey.completedCount }));
    }

    if (inProgressCount > 0) {
      parts.push(t('card.inProgressCount', { count: inProgressCount }));
    }

    return parts.join(', ');
  })();

  const completionRate = !isDraft
    ? calculateCompletionRate(survey.completedCount, survey.responseCount)
    : null;

  const lastResponseLabel =
    survey.lastResponseAt != null
      ? t('card.lastResponse', {
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
          {/* Row 1: Title + Badge + Menu */}
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-foreground truncate text-sm leading-snug font-semibold">
                  {survey.title}
                </h3>
                <SurveyStatusBadge status={survey.status} />
              </div>

              {/* Row 2: Description */}
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs leading-relaxed">
                {survey.description || <span className="italic">{t('card.noDescription')}</span>}
              </p>
            </div>

            {/* Menu — always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground shrink-0"
                  aria-label={t('actions.moreActions')}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onQuickPreview && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      onQuickPreview(survey.id);
                    }}
                  >
                    <Eye className="size-4" aria-hidden />
                    {t('actions.quickPreview')}
                  </DropdownMenuItem>
                )}

                {isActive && shareUrl && (
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="size-4" aria-hidden />
                    {t('actions.share')}
                  </DropdownMenuItem>
                )}

                {!isDraft && (
                  <DropdownMenuItem asChild>
                    <Link href={getSurveyStatsUrl(survey.id)}>
                      <BarChart3 className="size-4" />
                      {t('actions.viewResults')}
                    </Link>
                  </DropdownMenuItem>
                )}

                {isDraft && (
                  <DropdownMenuItem asChild>
                    <Link href={getSurveyEditUrl(survey.id)}>
                      <Pencil className="size-4" />
                      {t('actions.edit')}
                    </Link>
                  </DropdownMenuItem>
                )}

                {availableActions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {availableActions.map((action) => {
                      const ui = SURVEY_ACTION_UI[action];
                      const Icon = ui.icon;
                      const isDestructive = ui.confirm?.variant === 'destructive';

                      return (
                        <DropdownMenuItem
                          key={action}
                          onClick={() => handleActionClick(action)}
                          className={cn(isDestructive && 'text-destructive focus:text-destructive')}
                        >
                          <Icon className="size-4" aria-hidden />
                          {t(`actions.${action}`)}
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 3: Metadata and sparkline */}
          <div className="border-border/50 bg-muted/30 mt-3 flex min-w-0 flex-col gap-2 rounded-lg px-2.5 py-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5">
            <div className="text-muted-foreground min-w-0 shrink-0 text-xs leading-relaxed">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="truncate">{tCategories(survey.category as never)}</span>
                <span className="text-border/60 shrink-0" aria-hidden>
                  ·
                </span>
                <span className="shrink-0">
                  {t('card.questions', { count: survey.questionCount })}
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
                  {completionRate !== null && (
                    <>
                      <span className="text-border/60 shrink-0" aria-hidden>
                        ·
                      </span>
                      <span>{t('card.completionRate', { rate: completionRate })}</span>
                    </>
                  )}
                </div>
              )}
              {lastResponseLabel != null && (
                <div className="mt-0.5 truncate">{lastResponseLabel}</div>
              )}
            </div>
            <Sparkline data={survey.recentActivity} className={cn('shrink-0', sparklineColor)} />
          </div>

          {/* Row 4: Contextual hint */}
          {hint && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1.5 text-xs',
                hint.severity === 'warning' && 'text-amber-600 dark:text-amber-400',
                hint.severity === 'success' && 'text-emerald-600 dark:text-emerald-400',
                hint.severity === 'info' && 'text-muted-foreground'
              )}
            >
              {hint.severity === 'warning' && <AlertTriangle className="size-3 shrink-0" />}
              {hint.severity === 'success' && (
                <span className="inline-flex size-1.5 shrink-0 rounded-full bg-emerald-500" />
              )}
              <span>{hint.text}</span>
            </div>
          )}

          {/* Row 5: Progress bar (active surveys with respondent limit) */}
          {isActive && survey.maxRespondents && survey.maxRespondents > 0 && (
            <div className="mt-2.5">
              <div className="bg-muted h-1 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    survey.responseCount / survey.maxRespondents >= 0.8
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
    </>
  );
};
