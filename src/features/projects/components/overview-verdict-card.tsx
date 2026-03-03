'use client';

import { useMemo } from 'react';

import { ArrowRight, ClipboardList, Lightbulb, Rocket, Send, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { VERDICT_STATUS_CONFIG, type VerdictResult } from '@/features/projects/config/verdict';
import {
  type NextStepAction,
  type NextStepInput,
  computeNextStep,
} from '@/features/projects/lib/next-step';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { ResearchPhase } from '@/features/projects/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

const ACTION_ICONS: Record<NextStepAction, LucideIcon> = {
  'create-survey': ClipboardList,
  'activate-survey': Rocket,
  'share-survey': Share2,
  'review-findings': Lightbulb,
  'make-decision': ArrowRight,
  continue: Send,
};

interface OverviewVerdictCardProps {
  verdict: VerdictResult;
  totalResponses: number;
  targetResponses: number;
  projectId: string;
  currentPhase: ResearchPhase | null;
  activeSurveys: number;
  totalSurveys: number;
  insightCount: number;
  isArchived: boolean;
}

export function OverviewVerdictCard({
  verdict,
  totalResponses,
  targetResponses,
  projectId,
  currentPhase,
  activeSurveys,
  totalSurveys,
  insightCount,
  isArchived,
}: OverviewVerdictCardProps) {
  const t = useTranslations();
  const config = VERDICT_STATUS_CONFIG[verdict.status];
  const Icon = config.icon;
  const percent = Math.round(verdict.confidence * 100);

  const nextStepInput: NextStepInput = useMemo(
    () => ({
      totalSurveys,
      activeSurveys,
      totalResponses,
      targetResponses,
      insightCount,
      currentPhase,
    }),
    [totalSurveys, activeSurveys, totalResponses, targetResponses, insightCount, currentPhase]
  );

  const nextStep = useMemo(() => computeNextStep(nextStepInput), [nextStepInput]);
  const NextStepIcon = ACTION_ICONS[nextStep.action];

  const nextStepHref = nextStep.tab
    ? `${getProjectDetailUrl(projectId)}?tab=${nextStep.tab}`
    : undefined;

  return (
    <Card className={`gap-0 py-0 shadow-none ${config.colors.bg} ${config.colors.border}`}>
      <CardContent className="flex min-h-0 flex-col gap-0 p-4">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <StatusBadge
            labelKey={config.labelKey}
            descriptionKey={config.descriptionKey}
            ariaLabelKey={config.ariaLabelKey}
            variant="outline"
            badgeClassName={config.colors.badge}
          />
          <Icon className={`size-4 shrink-0 ${config.colors.icon}`} aria-hidden />
        </div>

        <p className={`mt-1.5 text-sm ${config.colors.text}`}>
          {t(verdict.summaryKey as MessageKey)}
        </p>

        <div className="mt-3 max-w-xs">
          <div className="bg-foreground/10 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${config.colors.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {t('projects.verdict.confidence' as MessageKey, {
              current: totalResponses,
              target: targetResponses,
            })}
          </p>
        </div>

        {!isArchived && (
          <>
            <Separator className="my-4" />

            <div className="flex items-center gap-3">
              <div className="text-muted-foreground flex size-8 shrink-0 items-center justify-center">
                <NextStepIcon className="size-4" aria-hidden />
              </div>

              <p className="text-foreground min-w-0 flex-1 text-sm">
                {t(nextStep.labelKey as MessageKey)}
              </p>

              {nextStepHref && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={nextStepHref}>
                    {t('projects.nextStep.action' as MessageKey)}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
