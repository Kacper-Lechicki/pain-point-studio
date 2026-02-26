'use client';

import { useState } from 'react';

import { BarChart3, Copy, Ellipsis, Pencil } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
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
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import {
  SURVEY_ACTION_UI,
  deriveSurveyFlags,
  getAvailableActions,
} from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import { getSurveyEditUrl, getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Pagination ──────────────────────────────────────────────────────

const PAGE_SIZE = 10;

interface SurveyDataTableProps {
  surveys: ProjectSurvey[];
  onStatusChange: (surveyId: string, action: string) => void;
}

export function SurveyDataTable({ surveys, onStatusChange }: SurveyDataTableProps) {
  const t = useTranslations();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(surveys.length / PAGE_SIZE));
  // Clamp page to valid range (handles list shrinking past current page)
  const currentPage = Math.min(page, totalPages - 1);
  const paged = surveys.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const from = currentPage * PAGE_SIZE + 1;
  const to = Math.min((currentPage + 1) * PAGE_SIZE, surveys.length);

  if (surveys.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {/* Header */}
        <div className="bg-muted/30 flex items-center px-3 py-2.5">
          <div className="min-w-0 flex-1 pl-0.5">
            <span className="text-muted-foreground text-xs font-medium">
              {t('projects.detail.research.table.title')}
            </span>
          </div>
          <div className="border-border/30 w-[100px] border-l pl-3">
            <span className="text-muted-foreground text-xs font-medium">
              {t('projects.detail.research.table.status')}
            </span>
          </div>
          <div className="border-border/30 w-[100px] border-l pl-3">
            <span className="text-muted-foreground text-xs font-medium">
              {t('projects.detail.research.table.responses')}
            </span>
          </div>
          <div className="border-border/30 w-[90px] border-l pl-3">
            <span className="text-muted-foreground text-xs font-medium">
              {t('projects.detail.research.table.questions')}
            </span>
          </div>
          <div className="w-10" />
        </div>

        {/* Rows */}
        {paged.map((survey, i) => (
          <SurveyTableRow
            key={survey.id}
            survey={survey}
            isEven={i % 2 === 1}
            isLast={i === paged.length - 1}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {t('projects.detail.research.pagination.showing', {
              from,
              to,
              total: surveys.length,
            })}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label={t('projects.detail.research.pagination.previous')}
            >
              <span className="text-xs">‹</span>
            </Button>

            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i === currentPage ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === currentPage ? 'page' : undefined}
              >
                <span className="text-xs">{i + 1}</span>
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label={t('projects.detail.research.pagination.next')}
            >
              <span className="text-xs">›</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row ─────────────────────────────────────────────────────────────

interface SurveyTableRowProps {
  survey: ProjectSurvey;
  isEven: boolean;
  isLast: boolean;
  onStatusChange: (surveyId: string, action: string) => void;
}

function SurveyTableRow({ survey, isEven, isLast, onStatusChange }: SurveyTableRowProps) {
  const t = useTranslations();
  const locale = useLocale();
  const status = survey.status as SurveyStatus;
  const { isDraft } = deriveSurveyFlags(status);
  const href = isDraft ? getSurveyEditUrl(survey.id) : getSurveyStatsUrl(survey.id);

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const availableActions = getAvailableActions(status);

  const handleCopyShareLink = () => {
    if (survey.status === 'draft') {
      return;
    }

    const shareUrl = getSurveyShareUrl(locale, survey.id);
    void navigator.clipboard.writeText(shareUrl);
    toast.success(t('projects.detail.research.actions.linkCopied' as MessageKey));
  };

  const responseDisplay =
    survey.responseCount > 0
      ? String(survey.responseCount)
      : t('projects.detail.research.noResponses' as MessageKey);

  return (
    <>
      <div
        className={cn(
          'group hover:bg-muted/40 flex min-h-14 items-center px-3 py-2.5 transition-colors',
          isEven && 'bg-muted/20',
          !isLast && 'border-b'
        )}
      >
        {/* Title cell */}
        <div className="min-w-0 flex-1">
          <Link href={href} className="group/link block min-w-0">
            <span className="text-foreground text-[13px] font-semibold group-hover/link:underline">
              {survey.title}
            </span>
            {survey.description && (
              <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
                {survey.description}
              </span>
            )}
          </Link>
        </div>

        {/* Status cell */}
        <div className="border-border/30 w-[100px] border-l pl-3">
          <SurveyStatusBadge status={status} />
        </div>

        {/* Responses cell */}
        <div className="border-border/30 w-[100px] border-l pl-3">
          <span className="text-muted-foreground text-xs tabular-nums">{responseDisplay}</span>
        </div>

        {/* Questions cell */}
        <div className="border-border/30 w-[90px] border-l pl-3">
          <span className="text-muted-foreground text-xs tabular-nums">{survey.questionCount}</span>
        </div>

        {/* Actions cell */}
        <div className="flex w-10 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* View results */}
              {!isDraft && (
                <DropdownMenuItem asChild>
                  <Link href={getSurveyStatsUrl(survey.id)}>
                    <BarChart3 className="size-4" aria-hidden />
                    {t('projects.detail.research.actions.viewResults' as MessageKey)}
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Copy share link */}
              {!isDraft && (
                <DropdownMenuItem onClick={handleCopyShareLink}>
                  <Copy className="size-4" aria-hidden />
                  {t('projects.detail.research.actions.share' as MessageKey)}
                </DropdownMenuItem>
              )}

              {/* Edit */}
              {isDraft && (
                <DropdownMenuItem asChild>
                  <Link href={getSurveyEditUrl(survey.id)}>
                    <Pencil className="size-4" aria-hidden />
                    {t('projects.detail.research.actions.edit' as MessageKey)}
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Status actions */}
              {availableActions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {availableActions.map((action) => {
                    const ui = SURVEY_ACTION_UI[action];
                    const Icon = ui.icon;

                    return (
                      <DropdownMenuItem
                        key={action}
                        variant={ui.menuItemVariant ?? 'default'}
                        onClick={() => handleActionClick(action)}
                      >
                        <Icon className="size-4" aria-hidden />
                        {t(`surveys.dashboard.actions.${action}` as MessageKey)}
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
    </>
  );
}
