import { useMemo } from 'react';

import { BarChart3, Download, Pencil, Send, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  onExport?: (() => void) | undefined;
  onActionClick: (action: SurveyAction) => void;
}

// ── Primary action item definition ────────────────────────────────────
type PrimaryActionItem =
  | {
      kind: 'link';
      key: string;
      label: string;
      icon: LucideIcon;
      href: string;
      variant?: 'default' | 'outline';
    }
  | {
      kind: 'button';
      key: string;
      label: string;
      icon: LucideIcon;
      onClick: () => void;
      variant?: 'default' | 'outline';
    };

export function DetailPanelActions({
  surveyId,
  questionCount,
  flags,
  hasShareableLink,
  availableActions,
  onShare,
  onExport,
  onActionClick,
}: DetailPanelActionsProps) {
  const t = useTranslations();
  const canPublish = flags.isDraft && questionCount >= QUESTIONS_MIN;

  // Build visible primary items then sort alphabetically by label
  const primaryItems = useMemo(() => {
    const items: PrimaryActionItem[] = [];

    if (flags.isDraft) {
      if (canPublish) {
        items.push({
          kind: 'link',
          key: 'publish',
          label: t('surveys.builder.publish'),
          icon: Send,
          href: getSurveyPublishUrl(surveyId),
          variant: 'default',
        });
      }

      items.push({
        kind: 'link',
        key: 'edit',
        label: t('surveys.dashboard.actions.edit'),
        icon: Pencil,
        href: getSurveyEditUrl(surveyId),
        variant: 'outline',
      });
    }

    if (!flags.isDraft && !flags.isArchived) {
      items.push({
        kind: 'link',
        key: 'viewResults',
        label: t('surveys.dashboard.detailPanel.viewResults'),
        icon: BarChart3,
        href: getSurveyStatsUrl(surveyId),
        variant: 'default',
      });
    }

    if (hasShareableLink) {
      items.push({
        kind: 'button',
        key: 'share',
        label: t('surveys.dashboard.actions.share'),
        icon: Share2,
        onClick: onShare,
        variant: 'outline',
      });
    }

    if (!flags.isDraft && !flags.isArchived && onExport) {
      items.push({
        kind: 'button',
        key: 'export',
        label: t('surveys.dashboard.actions.export'),
        icon: Download,
        onClick: onExport,
        variant: 'outline',
      });
    }

    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [t, flags, canPublish, hasShareableLink, onShare, onExport, surveyId]);

  // Sort status-change actions alphabetically by translated label
  const sortedActions = useMemo(
    () =>
      [...availableActions].sort((a, b) =>
        t(`surveys.dashboard.actions.${a}`).localeCompare(t(`surveys.dashboard.actions.${b}`))
      ),
    [availableActions, t]
  );

  return (
    <>
      <SectionLabel>{t('surveys.dashboard.detailPanel.actionsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        {primaryItems.map((item) =>
          item.kind === 'link' ? (
            <Button
              key={item.key}
              variant={item.variant ?? 'outline'}
              size="sm"
              className="w-full"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </Button>
          ) : (
            <Button
              key={item.key}
              variant={item.variant ?? 'outline'}
              size="sm"
              className="w-full"
              onClick={item.onClick}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Button>
          )
        )}
      </div>

      {sortedActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sortedActions.map((action) => {
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
