'use client';

import { Download, Eye, Pencil, Send, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { QUESTIONS_MIN } from '@/features/surveys/config/constraints';
import type { SurveyAction } from '@/features/surveys/config/survey-status';
import { SURVEY_ACTION_UI } from '@/features/surveys/config/survey-status';
import Link from '@/i18n/link';
import { getSurveyEditUrl, getSurveyPublishUrl } from '@/lib/common/urls/survey-urls';

interface SurveyActionMenuContentProps {
  surveyId: string;
  flags: {
    isDraft: boolean;
    isArchived: boolean;
    isTrashed: boolean;
    hasShareableLink: boolean;
    questionCount: number;
  };
  availableActions: SurveyAction[];
  onShare: () => void;
  onExport?: (() => void) | undefined;
  handleActionClick: (action: SurveyAction) => void;
  onDetails?: (() => void) | undefined;
  detailsLabelKey?: 'quickPreview' | 'details';
}

type PrimaryMenuItem =
  | { kind: 'button'; key: string; label: string; icon: LucideIcon; onClick: () => void }
  | { kind: 'link'; key: string; label: string; icon: LucideIcon; href: string };

export function SurveyActionMenuContent({
  surveyId,
  flags,
  availableActions,
  onShare,
  onExport,
  handleActionClick,
  onDetails,
  detailsLabelKey = 'details',
}: SurveyActionMenuContentProps) {
  const t = useTranslations();
  const { isDraft, isArchived, isTrashed, hasShareableLink, questionCount } = flags;
  const canPublish = isDraft && questionCount >= QUESTIONS_MIN;

  const primaryItems = (() => {
    if (isTrashed) {
      return [];
    }

    const items: PrimaryMenuItem[] = [];

    if (onDetails) {
      items.push({
        kind: 'button',
        key: 'details',
        label: t(`surveys.dashboard.actions.${detailsLabelKey}`),
        icon: Eye,
        onClick: onDetails,
      });
    }

    if (hasShareableLink) {
      items.push({
        kind: 'button',
        key: 'share',
        label: t('surveys.dashboard.actions.share'),
        icon: Share2,
        onClick: onShare,
      });
    }

    if (!isDraft && !isArchived && onExport) {
      items.push({
        kind: 'button',
        key: 'export',
        label: t('surveys.dashboard.actions.export'),
        icon: Download,
        onClick: onExport,
      });
    }

    if (isDraft) {
      items.push({
        kind: 'link',
        key: 'edit',
        label: t('surveys.dashboard.actions.edit'),
        icon: Pencil,
        href: getSurveyEditUrl(surveyId),
      });
    }

    if (canPublish) {
      items.push({
        kind: 'link',
        key: 'publish',
        label: t('surveys.dashboard.actions.publish'),
        icon: Send,
        href: getSurveyPublishUrl(surveyId),
      });
    }

    return items.sort((a, b) => a.label.localeCompare(b.label));
  })();

  const sortedActions = availableActions;

  return (
    <DropdownMenuContent align="end">
      {primaryItems.map((item) =>
        item.kind === 'link' ? (
          <DropdownMenuItem key={item.key} asChild>
            <Link href={item.href}>
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem key={item.key} onClick={item.onClick}>
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </DropdownMenuItem>
        )
      )}

      {sortedActions.length > 0 && (
        <>
          {primaryItems.length > 0 && <DropdownMenuSeparator />}
          {sortedActions.map((action) => {
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
