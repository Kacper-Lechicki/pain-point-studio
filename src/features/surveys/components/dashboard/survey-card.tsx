'use client';

import { useState, useTransition } from 'react';

import {
  AlertTriangle,
  Archive,
  BarChart3,
  Eye,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Share2,
  SquareX,
  Trash2,
} from 'lucide-react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  archiveSurvey,
  closeSurvey,
  deleteSurveyDraft,
  reopenSurvey,
} from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import { env } from '@/lib/common/env';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';

// ── Status visual mapping ───────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<SurveyStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  draft: 'secondary',
  closed: 'outline',
  archived: 'secondary',
};

const STATUS_BADGE_CLASS: Record<SurveyStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  draft: '',
  closed: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  archived: 'opacity-60',
};

// ── Contextual hint logic ───────────────────────────────────────────

type HintSeverity = 'warning' | 'info' | 'success';

interface CardHint {
  severity: HintSeverity;
  text: string;
}

function computeHint(
  survey: UserSurvey,
  t: ReturnType<typeof useTranslations<'surveys.dashboard'>>
): CardHint | null {
  const now = new Date();

  // ── Drafts ──
  if (survey.status === 'draft') {
    if (survey.questionCount === 0) {
      return { severity: 'info', text: t('hints.noQuestions') };
    }

    return {
      severity: 'success',
      text: t('hints.readyToPublish', { count: survey.questionCount }),
    };
  }

  // ── Active — prioritize warnings ──
  if (survey.status === 'active') {
    if (survey.maxRespondents) {
      const pct = survey.responseCount / survey.maxRespondents;

      if (pct >= 1) {
        return { severity: 'warning', text: t('hints.limitReached') };
      }

      if (pct >= 0.8) {
        return {
          severity: 'warning',
          text: t('hints.nearingLimit', {
            current: survey.responseCount,
            max: survey.maxRespondents,
          }),
        };
      }
    }

    if (survey.endsAt) {
      const daysLeft = Math.ceil(
        (new Date(survey.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 0) {
        return { severity: 'warning', text: t('hints.expired') };
      }

      if (daysLeft <= 3) {
        return { severity: 'warning', text: t('hints.endingSoon', { days: daysLeft }) };
      }
    }

    if (survey.responseCount === 0) {
      return { severity: 'info', text: t('hints.noResponsesYet') };
    }
  }

  // ── Closed ──
  if (survey.status === 'closed') {
    if (survey.responseCount > 0) {
      const rate = Math.round((survey.completedCount / survey.responseCount) * 100);

      return { severity: 'info', text: t('hints.completionRate', { rate }) };
    }

    return { severity: 'info', text: t('hints.noResponsesCollected') };
  }

  return null;
}

// ── Action configuration ─────────────────────────────────────────────

type ConfirmableAction = 'close' | 'archive' | 'delete';
type SurveyAction = ConfirmableAction | 'reopen';

const ACTION_CONFIGS = {
  close: {
    fn: closeSurvey,
    toastKey: 'toast.closed',
    confirm: {
      titleKey: 'confirm.closeTitle',
      descriptionKey: 'confirm.closeDescription',
      variant: 'default' as const,
    },
  },
  reopen: { fn: reopenSurvey, toastKey: 'toast.reopened' },
  archive: {
    fn: archiveSurvey,
    toastKey: 'toast.archived',
    confirm: {
      titleKey: 'confirm.archiveTitle',
      descriptionKey: 'confirm.archiveDescription',
      variant: 'default' as const,
    },
  },
  delete: {
    fn: deleteSurveyDraft,
    toastKey: 'toast.deleted',
    confirm: {
      titleKey: 'confirm.deleteTitle',
      descriptionKey: 'confirm.deleteDescription',
      variant: 'destructive' as const,
    },
  },
} as const;

// ── Component ────────────────────────────────────────────────────────

interface SurveyCardProps {
  survey: UserSurvey;
  onStatusChange: (surveyId: string, action: string) => void;
  /** When set, adds "Quick preview" menu item that opens the detail panel (sets URL ?selected=id). */
  onQuickPreview?: (surveyId: string) => void;
}

export const SurveyCard = ({ survey, onStatusChange, onQuickPreview }: SurveyCardProps) => {
  const t = useTranslations('surveys.dashboard');
  const tCategories = useTranslations('surveys.categories');
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow();
  const [, startTransition] = useTransition();

  const [confirmDialog, setConfirmDialog] = useState<ConfirmableAction | null>(null);

  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';
  const isClosed = survey.status === 'closed';
  const isArchived = survey.status === 'archived';

  const href = isDraft
    ? `/dashboard/surveys/new/${survey.id}`
    : `/dashboard/surveys/stats/${survey.id}`;

  const shareUrl = survey.slug ? `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${survey.slug}` : null;

  const hint = computeHint(survey, t);
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const inProgressCount = survey.responseCount - survey.completedCount;
  const relativeUpdated = format.relativeTime(new Date(survey.updatedAt), now);

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('toast.linkCopied'));
  };

  const handleAction = (action: SurveyAction) => {
    startTransition(async () => {
      const config = ACTION_CONFIGS[action];
      const result = await config.fn({ surveyId: survey.id });
      setConfirmDialog(null);

      if (result.success) {
        toast.success(t(config.toastKey));
        onStatusChange(survey.id, action);
      } else {
        toast.error(t('toast.actionFailed'));
      }
    });
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

  const completionRate =
    !isDraft && survey.responseCount > 0
      ? Math.round((survey.completedCount / survey.responseCount) * 100)
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
                <Badge
                  variant={STATUS_BADGE_VARIANT[survey.status]}
                  className={cn('text-[11px]', STATUS_BADGE_CLASS[survey.status])}
                >
                  {isActive && (
                    <span className="relative mr-0.5 flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                    </span>
                  )}
                  {t(`status.${survey.status}`)}
                </Badge>
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
                    <Link href={`/dashboard/surveys/stats/${survey.id}`}>
                      <BarChart3 className="size-4" />
                      {t('actions.viewResults')}
                    </Link>
                  </DropdownMenuItem>
                )}

                {isDraft && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/surveys/new/${survey.id}`}>
                      <Pencil className="size-4" />
                      {t('actions.edit')}
                    </Link>
                  </DropdownMenuItem>
                )}

                {(isActive || isClosed) && (
                  <>
                    <DropdownMenuSeparator />
                    {isActive && (
                      <DropdownMenuItem onClick={() => setConfirmDialog('close')}>
                        <SquareX className="size-4" />
                        {t('actions.close')}
                      </DropdownMenuItem>
                    )}
                    {isClosed && (
                      <DropdownMenuItem onClick={() => handleAction('reopen')}>
                        <RotateCcw className="size-4" />
                        {t('actions.reopen')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setConfirmDialog('archive')}>
                      <Archive className="size-4" />
                      {t('actions.archive')}
                    </DropdownMenuItem>
                  </>
                )}

                {isDraft && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmDialog('delete')}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 3: Metadata and sparkline — stack on narrow (300px+), row on sm+ */}
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

          {/* Row 4: Contextual hint (when present) */}
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

      {confirmDialog && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          onConfirm={() => handleAction(confirmDialog)}
          title={t(ACTION_CONFIGS[confirmDialog].confirm.titleKey as Parameters<typeof t>[0])}
          description={t(
            ACTION_CONFIGS[confirmDialog].confirm.descriptionKey as Parameters<typeof t>[0]
          )}
          confirmLabel={t(`actions.${confirmDialog}`)}
          variant={ACTION_CONFIGS[confirmDialog].confirm.variant}
        />
      )}
    </>
  );
};
