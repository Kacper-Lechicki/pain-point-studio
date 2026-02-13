'use client';

import { useState, useTransition } from 'react';

import {
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
import { TableCell, TableRow } from '@/components/ui/table';
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

type ConfirmableAction = 'close' | 'archive' | 'delete';
type SurveyAction = ConfirmableAction | 'reopen';

const ACTION_CONFIGS = {
  close: {
    fn: closeSurvey,
    toastKey: 'toast.closed',
    confirm: {
      titleKey: 'confirm.closeTitle',
      descriptionKey: 'confirm.closeDescription',
      variant: 'destructive' as const,
    },
  },
  reopen: { fn: reopenSurvey, toastKey: 'toast.reopened' },
  archive: {
    fn: archiveSurvey,
    toastKey: 'toast.archived',
    confirm: {
      titleKey: 'confirm.archiveTitle',
      descriptionKey: 'confirm.archiveDescription',
      variant: 'warning' as const,
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

interface SurveyListRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  onRestore?: (surveyId: string) => void;
  variant?: 'table' | 'card';
  /** When true, table shows one "Archived" column instead of last response + activity; card shows 3 metrics (questions, responses, archived). */
  archivedLayout?: boolean;
}

function ActionMenu({
  survey,
  onShare,
  onConfirmDialog,
  onReopen,
  onDetails,
  onRestore,
}: {
  survey: UserSurvey;
  onShare: () => void | Promise<void>;
  onConfirmDialog: (action: ConfirmableAction) => void;
  onReopen: () => void;
  onDetails: () => void;
  onRestore?: (surveyId: string) => void;
}) {
  const t = useTranslations('surveys.dashboard');
  const tArchive = useTranslations('surveys.archive');
  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';
  const isClosed = survey.status === 'closed';
  const isArchived = survey.status === 'archived';
  const shareUrl = survey.slug ? `${env.NEXT_PUBLIC_APP_URL}/${survey.slug}` : null;

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onDetails}>
        <Eye className="size-4" aria-hidden />
        {t('actions.details')}
      </DropdownMenuItem>
      {isActive && shareUrl && (
        <DropdownMenuItem onClick={onShare}>
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
      {(isActive || isClosed) && (
        <>
          <DropdownMenuSeparator />
          {isActive && (
            <DropdownMenuItem
              onClick={() => onConfirmDialog('close')}
              className="text-destructive focus:text-destructive"
            >
              <SquareX className="text-destructive size-4" aria-hidden />
              {t('actions.close')}
            </DropdownMenuItem>
          )}
          {isClosed && (
            <DropdownMenuItem onClick={onReopen}>
              <RotateCcw className="size-4" aria-hidden />
              {t('actions.reopen')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onConfirmDialog('archive')}
            className="text-amber-600 focus:text-amber-600 dark:text-amber-500 dark:focus:text-amber-500"
          >
            <Archive className="size-4 text-amber-600 dark:text-amber-500" aria-hidden />
            {t('actions.archive')}
          </DropdownMenuItem>
        </>
      )}
      {isArchived && onRestore && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onRestore(survey.id)}>
            <RotateCcw className="size-4" aria-hidden />
            {tArchive('actions.restore')}
          </DropdownMenuItem>
        </>
      )}
      {isDraft && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onConfirmDialog('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="text-destructive size-4" aria-hidden />
            {t('actions.delete')}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}

export function SurveyListRow({
  survey,
  isSelected,
  onSelect,
  onStatusChange,
  onRestore,
  variant = 'table',
  archivedLayout = false,
}: SurveyListRowProps) {
  const t = useTranslations('surveys.dashboard');
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow();
  const [, startTransition] = useTransition();

  const [confirmDialog, setConfirmDialog] = useState<ConfirmableAction | null>(null);

  const isArchived = survey.status === 'archived';
  const archivedAtLabel =
    isArchived && survey.updatedAt ? format.relativeTime(new Date(survey.updatedAt), now) : null;
  const shareUrl = survey.slug ? `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${survey.slug}` : null;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;

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

  const confirmDialogElement = confirmDialog && (
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
  );

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
              <Badge
                variant={STATUS_BADGE_VARIANT[survey.status]}
                className={cn('shrink-0 text-[11px]', STATUS_BADGE_CLASS[survey.status])}
              >
                {t(`status.${survey.status}`)}
              </Badge>
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
                <ActionMenu
                  survey={survey}
                  onShare={handleShare}
                  onConfirmDialog={(action) => setConfirmDialog(action)}
                  onReopen={() => handleAction('reopen')}
                  onDetails={() => onSelect(survey.id)}
                  {...(onRestore !== undefined && { onRestore })}
                />
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

  // Table variant
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
        <TableCell className="border-border/30 border-l">
          <Badge
            variant={STATUS_BADGE_VARIANT[survey.status]}
            className={cn('text-[11px]', STATUS_BADGE_CLASS[survey.status])}
          >
            {t(`status.${survey.status}`)}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground border-border/30 border-l text-xs tabular-nums">
          {survey.questionCount}
        </TableCell>
        <TableCell className="text-muted-foreground border-border/30 border-l text-xs tabular-nums">
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
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l text-xs lg:table-cell">
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
              <ActionMenu
                survey={survey}
                onShare={handleShare}
                onConfirmDialog={(action) => setConfirmDialog(action)}
                onReopen={() => handleAction('reopen')}
                onDetails={() => onSelect(survey.id)}
                {...(onRestore !== undefined && { onRestore })}
              />
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {confirmDialogElement}
    </>
  );
}
