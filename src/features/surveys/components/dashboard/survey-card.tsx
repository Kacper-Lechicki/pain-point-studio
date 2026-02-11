'use client';

import { useState, useTransition } from 'react';

import {
  Archive,
  BarChart3,
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
import Link from '@/i18n/link';
import { env } from '@/lib/common/env';

import { SurveyStatusBadge } from './survey-status-badge';

interface SurveyCardProps {
  survey: UserSurvey;
  onStatusChange: () => void;
}

export const SurveyCard = ({ survey, onStatusChange }: SurveyCardProps) => {
  const t = useTranslations('surveys.dashboard');
  const tCategories = useTranslations('surveys.categories');
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const [confirmDialog, setConfirmDialog] = useState<'close' | 'archive' | 'delete' | null>(null);

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

  const handleAction = (action: 'close' | 'reopen' | 'archive' | 'delete') => {
    startTransition(async () => {
      let result;

      switch (action) {
        case 'close':
          result = await closeSurvey({ surveyId: survey.id });

          if (result.success) {
            toast.success(t('toast.closed'));
          }

          break;
        case 'reopen':
          result = await reopenSurvey({ surveyId: survey.id });

          if (result.success) {
            toast.success(t('toast.reopened'));
          }

          break;
        case 'archive':
          result = await archiveSurvey({ surveyId: survey.id });

          if (result.success) {
            toast.success(t('toast.archived'));
          }

          break;
        case 'delete':
          result = await deleteSurveyDraft({ surveyId: survey.id });

          if (result.success) {
            toast.success(t('toast.deleted'));
          }

          break;
      }

      setConfirmDialog(null);

      if (result?.success) {
        onStatusChange();
      }
    });
  };

  const createdDate = new Date(survey.createdAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="border-border bg-card group md:hover:bg-accent/50 flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors">
        <Link href={href} className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground truncate text-sm font-medium">{survey.title}</h3>
            <SurveyStatusBadge status={survey.status} />
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Badge variant="outline" className="text-xs font-normal">
              {tCategories(survey.category as never)}
            </Badge>
            <span>{t('card.responses', { count: survey.responseCount })}</span>
            <span>{t('card.created', { date: createdDate })}</span>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
              aria-label={t('actions.moreActions')}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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

            {(isActive || isClosed || isDraft) && <DropdownMenuSeparator />}

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

            {(isActive || isClosed) && (
              <DropdownMenuItem onClick={() => setConfirmDialog('archive')}>
                <Archive className="size-4" />
                {t('actions.archive')}
              </DropdownMenuItem>
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

      <ConfirmDialog
        open={confirmDialog === 'close'}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        onConfirm={() => handleAction('close')}
        title={t('confirm.closeTitle')}
        description={t('confirm.closeDescription')}
        confirmLabel={t('actions.close')}
        variant="default"
      />

      <ConfirmDialog
        open={confirmDialog === 'archive'}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        onConfirm={() => handleAction('archive')}
        title={t('confirm.archiveTitle')}
        description={t('confirm.archiveDescription')}
        confirmLabel={t('actions.archive')}
        variant="default"
      />

      <ConfirmDialog
        open={confirmDialog === 'delete'}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        onConfirm={() => handleAction('delete')}
        title={t('confirm.deleteTitle')}
        description={t('confirm.deleteDescription')}
        confirmLabel={t('actions.delete')}
      />
    </>
  );
};
