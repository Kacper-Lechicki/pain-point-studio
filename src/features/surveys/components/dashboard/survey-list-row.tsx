'use client';

import { BarChart3, Eye, MoreHorizontal, Pencil, Share2 } from 'lucide-react';
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
import { TableCell, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SURVEY_ACTION_UI, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import Link from '@/i18n/link';
import { env } from '@/lib/common/env';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Component ───────────────────────────────────────────────────────

interface SurveyListRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: 'table' | 'card';
  /** When true, table shows one "Archived" column instead of last response + activity; card shows 3 metrics (questions, responses, archived). */
  archivedLayout?: boolean;
}

export function SurveyListRow({
  survey,
  isSelected,
  onSelect,
  onStatusChange,
  variant = 'table',
  archivedLayout = false,
}: SurveyListRowProps) {
  const t = useTranslations('surveys.dashboard');
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow();

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);

  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';
  const isArchived = survey.status === 'archived';

  const archivedAtLabel =
    isArchived && survey.updatedAt ? format.relativeTime(new Date(survey.updatedAt), now) : null;
  const shareUrl = survey.slug ? `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${survey.slug}` : null;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;
  const availableActions = getAvailableActions(survey.status);

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('toast.linkCopied'));
  };

  const tableRowInteraction = {
    onClick: () => onSelect(survey.id),
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(survey.id);
      }
    },
    'aria-pressed': isSelected,
    'aria-label': survey.title,
  };

  // ── Shared dropdown menu content ────────────────────────────────

  const menuContent = (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onSelect(survey.id)}>
        <Eye className="size-4" aria-hidden />
        {t('actions.details')}
      </DropdownMenuItem>

      {isActive && shareUrl && (
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="size-4" aria-hidden />
          {t('actions.share')}
        </DropdownMenuItem>
      )}

      {!isDraft && (
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/surveys/stats/${survey.id}`}>
            <BarChart3 className="size-4" aria-hidden />
            {t('actions.viewResults')}
          </Link>
        </DropdownMenuItem>
      )}

      {isDraft && (
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/surveys/new/${survey.id}`}>
            <Pencil className="size-4" aria-hidden />
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
  );

  // ── Shared confirm dialog ───────────────────────────────────────

  const confirmDialogElement = confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />;

  // ── Card variant ────────────────────────────────────────────────

  if (variant === 'card') {
    return (
      <>
        <div
          className={cn(
            'border-border/50 flex min-w-0 flex-col gap-3 rounded-lg border p-3 transition-all',
            isSelected && 'ring-ring/20 border-ring/40 bg-muted/50 ring-2'
          )}
        >
          {/* Header: title + badge + menu */}
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-foreground truncate text-sm font-semibold">{survey.title}</span>
              <SurveyStatusBadge status={survey.status} className="shrink-0" />
            </div>
            <div className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    aria-label={t('actions.moreActions')}
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                {menuContent}
              </DropdownMenu>
            </div>
          </div>

          {/* Description snippet */}
          {survey.description && (
            <p className="text-muted-foreground -mt-1 line-clamp-1 text-xs">{survey.description}</p>
          )}

          {/* Metrics grid */}
          <div
            className={cn(
              'text-muted-foreground grid gap-x-4 gap-y-2 text-xs',
              isArchived || archivedLayout ? 'grid-cols-3' : 'grid-cols-2'
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span>{t('table.questions')}</span>
              <span className="text-foreground font-medium tabular-nums">
                {survey.questionCount}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>{t('table.responses')}</span>
              <span className="text-foreground font-medium tabular-nums">
                {survey.maxRespondents != null
                  ? t('card.responsesOfMax', {
                      completed: survey.completedCount,
                      max: survey.maxRespondents,
                    })
                  : survey.completedCount}
              </span>
            </div>
            {(isArchived || archivedLayout) && archivedAtLabel != null ? (
              <div className="flex flex-col gap-0.5">
                <span>{t('table.archivedAt')}</span>
                <span className="text-foreground font-medium tabular-nums">{archivedAtLabel}</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-0.5">
                  <span>{t('table.lastResponse')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {lastResponseLabel ?? '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span>{t('table.activity')}</span>
                  <Sparkline
                    data={survey.recentActivity}
                    className={cn('shrink-0', sparklineColor)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        {confirmDialogElement}
      </>
    );
  }

  // ── Table variant ───────────────────────────────────────────────

  return (
    <>
      <TableRow
        className={cn(
          'even:bg-muted/80 h-14 cursor-pointer transition-all',
          isSelected && 'bg-muted/60 even:bg-muted/60'
        )}
        {...tableRowInteraction}
      >
        <TableCell className="min-w-0 overflow-hidden py-2.5">
          <span className="text-foreground block truncate text-sm font-semibold">
            {survey.title}
          </span>
          {survey.description && (
            <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
              {survey.description}
            </p>
          )}
        </TableCell>
        <TableCell className="border-border/30 min-w-0 border-l text-center">
          <SurveyStatusBadge status={survey.status} />
        </TableCell>
        <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
          {survey.questionCount}
        </TableCell>
        <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
          {survey.maxRespondents != null
            ? `${survey.completedCount}/${survey.maxRespondents}`
            : survey.completedCount}
        </TableCell>
        {archivedLayout && archivedAtLabel != null ? (
          <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs">
            {archivedAtLabel}
          </TableCell>
        ) : (
          <>
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l pr-4 pl-3 text-xs lg:table-cell">
              {lastResponseLabel ?? '—'}
            </TableCell>
            <TableCell className="border-border/30 hidden min-w-0 border-l text-center xl:table-cell">
              <Sparkline
                data={survey.recentActivity}
                className={cn('mx-auto shrink-0', sparklineColor)}
              />
            </TableCell>
          </>
        )}
        <TableCell className="w-10 p-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={t('actions.moreActions')}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              {menuContent}
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {confirmDialogElement}
    </>
  );
}
