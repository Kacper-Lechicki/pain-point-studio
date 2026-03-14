'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Monitor,
  Smartphone,
  Tablet,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getResponseDetail } from '@/features/surveys/actions/get-response-detail';
import type {
  DeviceType,
  ResponseDetail,
  SurveyResponseListItem,
} from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

import { ResponseAnswerDisplay } from './response-answer-display';
import { ResponseStatusBadge } from './response-status-badge';

interface ResponseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseId: string | null;
  responseMeta: SurveyResponseListItem | null;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const DEVICE_ICONS: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) {
    return '—';
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function ResponseDetailDialog({
  open,
  onOpenChange,
  responseId,
  responseMeta,
  canNavigatePrev,
  canNavigateNext,
  onNavigate,
}: ResponseDetailDialogProps) {
  const t = useTranslations('surveys.stats.responseList');
  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [isLoading, startTransition] = useTransition();

  const fetchDetail = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await getResponseDetail({ responseId: id });

        if (result.success && result.data) {
          setDetail(result.data);
        }
      });
    },
    [startTransition]
  );

  useEffect(() => {
    if (open && responseId) {
      fetchDetail(responseId);
    }
  }, [open, responseId, fetchDetail]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDetail(null);
    }

    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canNavigatePrev) {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && canNavigateNext) {
        e.preventDefault();
        onNavigate('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, canNavigatePrev, canNavigateNext, onNavigate]);

  const meta = responseMeta;
  const DeviceIcon = meta?.deviceType ? DEVICE_ICONS[meta.deviceType] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'flex h-full max-h-full w-full max-w-full flex-col gap-0 rounded-none p-0',
          'sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-lg'
        )}
      >
        <DialogHeader className="border-border/50 shrink-0 items-center border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">{t('detailTitle')}</DialogTitle>
            {meta && <ResponseStatusBadge status={meta.status} />}
          </div>
          <DialogDescription className="sr-only">{t('detailTitle')}</DialogDescription>
        </DialogHeader>

        {meta && (
          <div className="border-border/50 bg-muted/30 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2.5 sm:px-6">
            {meta.completedAt && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {new Date(meta.completedAt).toLocaleString()}
              </span>
            )}

            {meta.deviceType && DeviceIcon && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <DeviceIcon className="size-3.5" />
                {t(`device_${meta.deviceType}`)}
              </span>
            )}

            {meta.durationSeconds != null && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
                <Clock className="size-3.5" />
                {formatDuration(meta.durationSeconds)}
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-4 py-4 sm:px-6 sm:py-5">
            {isLoading ? (
              <div className="flex flex-col gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : detail?.answers && detail.answers.length > 0 ? (
              <div className="flex flex-col gap-6">
                {detail.answers.map((answer) => (
                  <ResponseAnswerDisplay key={answer.questionId} answer={answer} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">{t('noAnswers')}</p>
            )}

            {detail?.feedback && (
              <div className="border-border/50 flex flex-col gap-2 border-t pt-5">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t('feedback')}
                </p>
                <div className="border-border/50 bg-muted rounded-md border px-3 py-2.5">
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {detail.feedback}
                  </p>
                </div>
              </div>
            )}

            {(meta?.contactName || meta?.contactEmail) && (
              <div className="border-border/50 flex flex-col gap-3 border-t pt-5">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t('contact')}
                </p>

                {meta.contactName && (
                  <div className="text-foreground flex items-center gap-2 text-sm">
                    <User className="text-muted-foreground size-3.5 shrink-0" />
                    {meta.contactName}
                  </div>
                )}

                {meta.contactEmail && (
                  <div className="flex items-start gap-2">
                    <Mail className="text-muted-foreground mt-2.5 size-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <ClipboardInput value={meta.contactEmail} size="sm" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-border/50 flex shrink-0 items-center gap-1 border-t px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onNavigate('prev')}
            disabled={!canNavigatePrev}
            aria-label={t('prevResponse')}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onNavigate('next')}
            disabled={!canNavigateNext}
            aria-label={t('nextResponse')}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
