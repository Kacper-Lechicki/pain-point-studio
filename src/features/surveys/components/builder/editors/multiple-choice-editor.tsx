'use client';

import { Circle, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QUESTION_OPTIONS_MAX, QUESTION_OPTION_MAX_LENGTH } from '@/features/surveys/config';
import { useQuestionBuilderContext } from '@/features/surveys/hooks/use-question-builder-context';
import type { QuestionSchema } from '@/features/surveys/types';

interface MultipleChoiceEditorProps {
  question: QuestionSchema;
}

export function MultipleChoiceEditor({ question }: MultipleChoiceEditorProps) {
  const t = useTranslations();
  const { updateQuestion } = useQuestionBuilderContext();

  const config = question.config as Record<string, unknown>;
  const options = (config.options as string[]) ?? ['', ''];
  const maxSelections = config.maxSelections as number | undefined;
  const allowOther = (config.allowOther as boolean) ?? false;

  function updateOptions(newOptions: string[]) {
    updateQuestion(question.id, { config: { ...config, options: newOptions } });
  }

  function handleOptionChange(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    updateOptions(updated);
  }

  function addOption() {
    if (options.length >= QUESTION_OPTIONS_MAX) {
      return;
    }

    updateOptions([...options, '']);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      return;
    }

    const newOptions = options.filter((_, i) => i !== index);
    const newAvailable = newOptions.length + (allowOther ? 1 : 0);
    const updates: Record<string, unknown> = { ...config, options: newOptions };

    if (maxSelections !== undefined && maxSelections > newAvailable) {
      updates.maxSelections = newAvailable;
    }

    updateQuestion(question.id, { config: updates });
  }

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Circle className="text-muted-foreground size-4 shrink-0" />
          <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={t('surveys.builder.typeSettings.optionPlaceholder', { number: index + 1 })}
            maxLength={QUESTION_OPTION_MAX_LENGTH}
            className="h-9 flex-1"
          />
          {options.length > 2 && (
            <Button
              variant="ghostDestructive"
              size="icon-xs"
              onClick={() => removeOption(index)}
              aria-label={t('surveys.builder.typeSettings.removeOption')}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      ))}

      {options.length < QUESTION_OPTIONS_MAX && (
        <Button variant="ghost" size="sm" onClick={addOption} className="text-muted-foreground">
          <Plus className="size-4" />
          {t('surveys.builder.typeSettings.addOption')}
        </Button>
      )}
    </div>
  );
}
