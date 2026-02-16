import { BarChart3, Eye, Pencil, Send, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { QUESTIONS_MIN } from '@/features/surveys/config/constraints';
import type { SurveyAction } from '@/features/surveys/config/survey-status';
import { SURVEY_ACTION_UI } from '@/features/surveys/config/survey-status';
import {
  getSurveyEditUrl,
  getSurveyPublishUrl,
  getSurveyStatsUrl,
} from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';

interface SurveyActionMenuContentProps {
  surveyId: string;
  /** Flags derived from survey status. */
  flags: {
    isDraft: boolean;
    isArchived: boolean;
    hasShareableLink: boolean;
    questionCount: number;
  };
  /** Status-transition actions available for this survey. */
  availableActions: SurveyAction[];
  onShare: () => void;
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
  handleActionClick,
  onDetails,
  detailsLabelKey = 'details',
}: SurveyActionMenuContentProps) {
  const t = useTranslations();
  const { isDraft, isArchived, hasShareableLink, questionCount } = flags;
  const canPublish = isDraft && questionCount >= QUESTIONS_MIN;

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

      {!isDraft && !isArchived && (
        <DropdownMenuItem asChild>
          <Link href={getSurveyStatsUrl(surveyId)}>
            <BarChart3 className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.viewResults')}
          </Link>
        </DropdownMenuItem>
      )}

      {isDraft && (
        <DropdownMenuItem asChild>
          <Link href={getSurveyEditUrl(surveyId)}>
            <Pencil className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.edit')}
          </Link>
        </DropdownMenuItem>
      )}

      {canPublish && (
        <DropdownMenuItem asChild>
          <Link href={getSurveyPublishUrl(surveyId)}>
            <Send className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.publish')}
          </Link>
        </DropdownMenuItem>
      )}

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
                {t(`surveys.dashboard.actions.${action}`)}
              </DropdownMenuItem>
            );
          })}
        </>
      )}
    </DropdownMenuContent>
  );
}
