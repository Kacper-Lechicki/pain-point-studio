import { BarChart3, Copy, Eye, Pencil, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { SurveyAction } from '@/features/surveys/config/survey-status';
import { SURVEY_ACTION_UI } from '@/features/surveys/config/survey-status';
import { getSurveyEditUrl, getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

interface SurveyActionMenuContentProps {
  surveyId: string;
  /** Flags derived from survey status. */
  flags: {
    isDraft: boolean;
    isPending: boolean;
    canDuplicate: boolean;
    hasShareableLink: boolean;
  };
  /** Status-transition actions available for this survey. */
  availableActions: SurveyAction[];
  onShare: () => void;
  onDuplicate: () => void;
  handleActionClick: (action: SurveyAction) => void;
  /** Show a "Quick Preview" / "Details" item. */
  onDetails?: () => void;
  /** Label key for the details item — defaults to 'details'. */
  detailsLabelKey?: 'quickPreview' | 'details';
}

export function SurveyActionMenuContent({
  surveyId,
  flags,
  availableActions,
  onShare,
  onDuplicate,
  handleActionClick,
  onDetails,
  detailsLabelKey = 'details',
}: SurveyActionMenuContentProps) {
  const t = useTranslations();
  const { isDraft, isPending, canDuplicate, hasShareableLink } = flags;

  return (
    <DropdownMenuContent align="end">
      {onDetails && (
        <DropdownMenuItem onClick={onDetails}>
          <Eye className="size-4" aria-hidden />
          {t(`surveys.dashboard.actions.${detailsLabelKey}`)}
        </DropdownMenuItem>
      )}

      {hasShareableLink && (
        <DropdownMenuItem onClick={onShare}>
          <Share2 className="size-4" aria-hidden />
          {t('surveys.dashboard.actions.share')}
        </DropdownMenuItem>
      )}

      {!isDraft && !isPending && (
        <DropdownMenuItem asChild>
          <Link href={getSurveyStatsUrl(surveyId)}>
            <BarChart3 className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.viewResults')}
          </Link>
        </DropdownMenuItem>
      )}

      {(isDraft || isPending) && (
        <DropdownMenuItem asChild>
          <Link href={getSurveyEditUrl(surveyId)}>
            <Pencil className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.edit')}
          </Link>
        </DropdownMenuItem>
      )}

      {canDuplicate && (
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="size-4" aria-hidden />
          {t('surveys.dashboard.actions.duplicate')}
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
                {t(`surveys.dashboard.actions.${action}`)}
              </DropdownMenuItem>
            );
          })}
        </>
      )}
    </DropdownMenuContent>
  );
}
