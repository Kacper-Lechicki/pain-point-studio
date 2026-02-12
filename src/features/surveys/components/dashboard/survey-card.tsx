'use client';

import { useState, useTransition } from 'react';

import {
  Archive,
  BarChart3,
  Calendar,
  Clock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Share2,
  SquareX,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
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

import { SurveyStatusBadge } from './survey-status-badge';

// ── Status accent colours (left border) ──────────────────────────────

const STATUS_ACCENT: Record<SurveyStatus, string> = {
  active: 'border-l-emerald-500',
  draft: 'border-l-border',
  closed: 'border-l-amber-500',
  archived: 'border-l-border opacity-60',
};

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
}

export const SurveyCard = ({ survey, onStatusChange }: SurveyCardProps) => {
  const t = useTranslations('surveys.dashboard');
  const tCategories = useTranslations('surveys.categories');
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const [confirmDialog, setConfirmDialog] = useState<ConfirmableAction | null>(null);

  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';
  const isClosed = survey.status === 'closed';

  const href = isDraft
    ? `/dashboard/surveys/new/${survey.id}`
    : `/dashboard/surveys/stats/${survey.id}`;

  const shareUrl = survey.slug ? `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${survey.slug}` : null;

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

  const createdDate = new Date(survey.createdAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const updatedDate = new Date(survey.updatedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div
        className={cn(
          'border-border bg-card group hover:bg-accent/40 relative rounded-lg border border-l-[3px] transition-colors',
          STATUS_ACCENT[survey.status]
        )}
      >
        <Link href={href} className="block px-4 py-3.5 sm:px-5 sm:py-4">
          {/* Row 1: title + badges */}
          <div className="flex items-start justify-between gap-3 pr-8">
            <h3 className="text-foreground min-w-0 truncate text-sm leading-snug font-semibold">
              {survey.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant="outline" className="text-[11px] font-normal">
                {tCategories(survey.category as never)}
              </Badge>
              <SurveyStatusBadge status={survey.status} />
            </div>
          </div>

          {/* Row 2: description */}
          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
            {survey.description || t('card.noDescription')}
          </p>

          {/* Row 3: meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {/* Responses */}
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <MessageSquare className="size-3 shrink-0" />
              {t('card.responses', { count: survey.responseCount })}
            </span>

            {/* Dates — pushed to the right on wider screens */}
            <div className="text-muted-foreground flex items-center gap-3 text-xs sm:ml-auto">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3 shrink-0" />
                {createdDate}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 shrink-0" />
                {updatedDate}
              </span>
            </div>
          </div>
        </Link>

        {/* Floating action button */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={t('actions.moreActions')}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Primary actions */}
              {isActive && shareUrl && (
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="size-4" />
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

              {/* Status actions */}
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

              {/* Destructive actions */}
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
