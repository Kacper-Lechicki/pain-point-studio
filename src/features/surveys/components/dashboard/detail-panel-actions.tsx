import { BarChart3, Pencil, Send, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { QUESTIONS_MIN } from '@/features/surveys/config';
import { SURVEY_ACTION_UI, type SurveyAction } from '@/features/surveys/config/survey-status';
import type { SurveyStatusFlags } from '@/features/surveys/config/survey-status';
import {
  getSurveyEditUrl,
  getSurveyPublishUrl,
  getSurveyStatsUrl,
} from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

interface DetailPanelActionsProps {
  surveyId: string;
  questionCount: number;
  flags: SurveyStatusFlags;
  hasShareableLink: boolean;
  availableActions: SurveyAction[];
  onShare: () => void;
  onActionClick: (action: SurveyAction) => void;
}

export function DetailPanelActions({
  surveyId,
  questionCount,
  flags,
  hasShareableLink,
  availableActions,
  onShare,
  onActionClick,
}: DetailPanelActionsProps) {
  const t = useTranslations();
  const canPublish = flags.isDraft && questionCount >= QUESTIONS_MIN;

  return (
    <>
      <SectionLabel>{t('surveys.dashboard.detailPanel.actionsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        {flags.isDraft && (
          <>
            {canPublish && (
              <Button size="sm" className="w-full" asChild>
                <Link href={getSurveyPublishUrl(surveyId)}>
                  <Send className="size-4" aria-hidden />
                  {t('surveys.builder.publish')}
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={getSurveyEditUrl(surveyId)}>
                <Pencil className="size-4" aria-hidden />
                {t('surveys.dashboard.actions.edit')}
              </Link>
            </Button>
          </>
        )}
        {!flags.isDraft && !flags.isArchived && (
          <Button asChild size="sm" className="w-full">
            <Link href={getSurveyStatsUrl(surveyId)}>
              <BarChart3 className="size-4" aria-hidden />
              {t('surveys.dashboard.detailPanel.viewResults')}
            </Link>
          </Button>
        )}
        {hasShareableLink && (
          <Button variant="outline" size="sm" className="w-full" onClick={onShare}>
            <Share2 className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.share')}
          </Button>
        )}
      </div>

      {availableActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {availableActions.map((action) => {
            const ui = SURVEY_ACTION_UI[action];
            const Icon = ui.icon;

            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent',
                  ui.buttonClassName
                )}
                onClick={() => onActionClick(action)}
              >
                <Icon className="size-3.5" aria-hidden />
                {t(`surveys.dashboard.actions.${action}`)}
              </Button>
            );
          })}
        </div>
      )}
    </>
  );
}
