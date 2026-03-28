'use client';

import { Check, Circle, ClipboardList, Copy, Rocket, Share2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SurveyStatus } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface SetupStep {
  label: string;
  icon: typeof ClipboardList;
  checked: boolean;
  disabled: boolean;
  action?: React.ReactNode;
}

interface OverviewSetupGuideProps {
  questionCount: number;
  surveyStatus: SurveyStatus;
  shareUrl: string | null;
  onShare: () => void;
}

export function OverviewSetupGuide({
  questionCount,
  surveyStatus,
  shareUrl,
  onShare,
}: OverviewSetupGuideProps) {
  const t = useTranslations();

  const isActive = surveyStatus === 'active';

  const steps: SetupStep[] = [
    {
      label: t('surveys.stats.overview.setupAddQuestions' as MessageKey),
      icon: ClipboardList,
      checked: questionCount > 0,
      disabled: false,
    },
    {
      label: t('surveys.stats.overview.setupPublish' as MessageKey),
      icon: Rocket,
      checked: isActive,
      disabled: false,
    },
    {
      label: t('surveys.stats.overview.setupShare' as MessageKey),
      icon: Share2,
      checked: false,
      disabled: !isActive || !shareUrl,
      action:
        isActive && shareUrl ? (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onShare}>
            <Copy className="size-3" aria-hidden />
            {t('surveys.stats.overview.setupCopyLink' as MessageKey)}
          </Button>
        ) : null,
    },
    {
      label: t('surveys.stats.overview.setupCollect' as MessageKey),
      icon: Users,
      checked: false,
      disabled: true,
    },
  ];

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-4 p-6">
        <div>
          <h3 className="text-foreground text-base font-semibold">
            {t('surveys.stats.overview.setupTitle' as MessageKey)}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('surveys.stats.overview.setupDescription' as MessageKey)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((step) => (
            <div
              key={step.label}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-3',
                step.disabled ? 'border-border/30 opacity-50' : 'border-border/50'
              )}
            >
              {step.checked ? (
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="size-3 text-white" />
                </div>
              ) : (
                <Circle
                  className={cn(
                    'size-5 shrink-0',
                    step.disabled ? 'text-muted-foreground/30' : 'text-muted-foreground/50'
                  )}
                />
              )}

              <div className="flex flex-1 items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-sm',
                    step.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}
                >
                  {step.label}
                </span>
                {step.action}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
