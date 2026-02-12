'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  QUESTION_OPTIONS_MAX,
  QUESTION_TYPE_ICONS,
  QUESTION_TYPE_LABEL_KEYS,
  RATING_SCALE_MAX,
  RATING_SCALE_MIN,
} from '@/features/surveys/config';
import { QUESTION_TYPES, type QuestionType } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

import { useQuestionBuilderContext } from '../../hooks/use-question-builder-context';

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
        <p className="text-muted-foreground text-sm">{t('surveys.builder.noQuestionSelected')}</p>
      </div>
    );
  }

  const config = activeQuestion.config as Record<string, unknown>;

  function updateConfig(updates: Record<string, unknown>) {
    updateQuestion(activeQuestion!.id, { config: { ...config, ...updates } });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Section: Question type */}
      <div className="mb-4">
        <Label className="text-muted-foreground mb-2 block text-xs font-medium tracking-wide uppercase">
          {t('surveys.builder.questionType')}
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {QUESTION_TYPES.map((type) => {
            const Icon = QUESTION_TYPE_ICONS[type];
            const labelKey = QUESTION_TYPE_LABEL_KEYS[type];

            return (
              <button
                key={type}
                type="button"
                onClick={() => changeQuestionType(activeQuestion.id, type as QuestionType)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md p-2 text-center transition-colors',
                  activeQuestion.type === type
                    ? 'bg-primary/10 text-primary ring-primary/30 ring-1'
                    : 'hover:bg-accent text-muted-foreground'
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

      {/* Section: Required toggle */}
      <div className="flex items-center justify-between py-4">
        <Label htmlFor="required-toggle" className="text-sm font-medium">
          {t('surveys.builder.required')}
        </Label>
        <Switch
          id="required-toggle"
          checked={activeQuestion.required}
          onCheckedChange={(checked) => updateQuestion(activeQuestion.id, { required: checked })}
        />
      </div>

      <Separator />

      {/* Section: Type-specific settings */}
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
  const t = useTranslations('surveys.builder');

  if (isDesktop) {
    return (
      <div className="border-border flex max-w-[280px] min-w-[280px] flex-col border-l">
        <BuilderSettingsPanelContent />
      </div>
    );
  }

  return (
    <Sheet open={open ?? false} onOpenChange={onOpenChange ?? (() => {})}>
      <SheetContent
        side="right"
        className="flex w-72 flex-col p-0"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetHeader className="border-border border-b px-4 py-2">
          <SheetTitle className="text-sm font-medium">{t('questionSettings')}</SheetTitle>
        </SheetHeader>
        <BuilderSettingsPanelContent />
      </SheetContent>
    </Sheet>
  );
}

// ── Type-specific settings components ───────────────────────────────

interface SettingsProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}

function MultipleChoiceSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations('surveys.builder.typeSettings');

  const minSelections = (config.minSelections as number) ?? undefined;
  const maxSelections = (config.maxSelections as number) ?? undefined;
  const allowOther = (config.allowOther as boolean) ?? false;
  const options = (config.options as string[]) ?? [];

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs">{t('minSelections')}</Label>
        <Input
          type="number"
          min={1}
          max={options.length}
          value={minSelections ?? ''}
          onChange={(e) =>
            onUpdate({
              minSelections: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('maxSelections')}</Label>
        <Input
          type="number"
          min={1}
          max={QUESTION_OPTIONS_MAX}
          value={maxSelections ?? ''}
          onChange={(e) =>
            onUpdate({
              maxSelections: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className="h-8"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{t('allowOther')}</Label>
        <Switch
          checked={allowOther}
          onCheckedChange={(checked) => onUpdate({ allowOther: checked })}
        />
      </div>
    </div>
  );
}

function RatingScaleSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations('surveys.builder.typeSettings');

  const min = (config.min as number) ?? RATING_SCALE_MIN;
  const max = (config.max as number) ?? 5;
  const minLabel = (config.minLabel as string) ?? '';
  const maxLabel = (config.maxLabel as string) ?? '';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 block text-xs">{t('scaleMin')}</Label>
          <Input
            type="number"
            min={RATING_SCALE_MIN}
            max={max - 1}
            value={min}
            onChange={(e) => onUpdate({ min: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">{t('scaleMax')}</Label>
          <Input
            type="number"
            min={min + 1}
            max={RATING_SCALE_MAX}
            value={max}
            onChange={(e) => onUpdate({ max: Number(e.target.value) })}
            className="h-8"
          />
        </div>
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('minLabel')}</Label>
        <Input
          value={minLabel}
          onChange={(e) => onUpdate({ minLabel: e.target.value })}
          placeholder={t('minLabelPlaceholder')}
          maxLength={100}
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('maxLabel')}</Label>
        <Input
          value={maxLabel}
          onChange={(e) => onUpdate({ maxLabel: e.target.value })}
          placeholder={t('maxLabelPlaceholder')}
          maxLength={100}
          className="h-8"
        />
      </div>
    </div>
  );
}

function TextSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations('surveys.builder.typeSettings');

  const placeholder = (config.placeholder as string) ?? '';
  const maxLength = (config.maxLength as number) ?? undefined;

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs">{t('placeholder')}</Label>
        <Input
          value={placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          maxLength={200}
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('maxLength')}</Label>
        <Input
          type="number"
          min={1}
          value={maxLength ?? ''}
          onChange={(e) =>
            onUpdate({
              maxLength: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className="h-8"
        />
      </div>
    </div>
  );
}
