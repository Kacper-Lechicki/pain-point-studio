'use client';

import { useTranslations } from 'next-intl';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BUILDER_PANEL_WIDTH_CLASS } from '@/config/layout';
import { ResponsivePanel } from '@/features/surveys/components/builder/responsive-panel';
import { MultipleChoiceSettings } from '@/features/surveys/components/builder/settings/multiple-choice-settings';
import { RatingScaleSettings } from '@/features/surveys/components/builder/settings/rating-scale-settings';
import { TextSettings } from '@/features/surveys/components/builder/settings/text-settings';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';
import { useQuestionBuilderContext } from '@/features/surveys/hooks/use-question-builder-context';
import { QUESTION_TYPES, type QuestionType } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

interface BuilderSettingsPanelProps {
  isDesktop: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function BuilderSettingsPanelContent() {
  const t = useTranslations();
  const { activeQuestion, updateQuestion, changeQuestionType } = useQuestionBuilderContext();

  if (!activeQuestion) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-xs">{t('surveys.builder.noQuestionSelected')}</p>
      </div>
    );
  }

  const config = activeQuestion.config as Record<string, unknown>;

  function updateConfig(updates: Record<string, unknown>) {
    updateQuestion(activeQuestion!.id, { config: { ...config, ...updates } });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4">
        <Label className="text-muted-foreground mb-2 block text-xs font-medium tracking-wide uppercase">
          {t('surveys.builder.questionType')}
        </Label>

        <div className="grid grid-cols-3 gap-1.5">
          {[...QUESTION_TYPES]
            .sort((a, b) =>
              t(QUESTION_TYPE_LABEL_KEYS[a] as Parameters<typeof t>[0]).localeCompare(
                t(QUESTION_TYPE_LABEL_KEYS[b] as Parameters<typeof t>[0])
              )
            )
            .map((type) => {
              const Icon = QUESTION_TYPE_ICONS[type];
              const labelKey = QUESTION_TYPE_LABEL_KEYS[type];

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => changeQuestionType(activeQuestion.id, type as QuestionType)}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-md p-1.5 text-center transition-colors',
                    activeQuestion.type === type
                      ? 'bg-primary/10 text-primary ring-primary/30 ring-1'
                      : 'md:hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Icon className="size-4" />

                  <span className="text-[10px] leading-tight">
                    {t(labelKey as Parameters<typeof t>[0])}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      <Separator />

      <div className="py-4">
        <Label className="text-muted-foreground mb-3 block text-xs font-medium tracking-wide uppercase">
          {t('surveys.builder.settings')}
        </Label>

        {activeQuestion.type === 'multiple_choice' && (
          <MultipleChoiceSettings config={config} onUpdate={updateConfig} />
        )}

        {activeQuestion.type === 'rating_scale' && (
          <RatingScaleSettings config={config} onUpdate={updateConfig} />
        )}

        {(activeQuestion.type === 'open_text' || activeQuestion.type === 'short_text') && (
          <TextSettings config={config} onUpdate={updateConfig} />
        )}

        {activeQuestion.type === 'yes_no' && (
          <p className="text-muted-foreground text-xs italic">
            {t('surveys.builder.noAdditionalSettings')}
          </p>
        )}
      </div>
    </div>
  );
}

export function BuilderSettingsPanel({ isDesktop, open, onOpenChange }: BuilderSettingsPanelProps) {
  const t = useTranslations();

  return (
    <ResponsivePanel
      isDesktop={isDesktop}
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={t('surveys.builder.questionSettings')}
      desktopClassName={`border-border flex ${BUILDER_PANEL_WIDTH_CLASS} flex-col border-l`}
    >
      <BuilderSettingsPanelContent />
    </ResponsivePanel>
  );
}
