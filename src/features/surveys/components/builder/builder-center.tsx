'use client';

import { useEffect, useRef } from 'react';

import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BuilderEmptyState } from '@/features/surveys/components/builder/builder-empty-state';
import { QuestionEditor } from '@/features/surveys/components/builder/editors/question-editor';
import {
  QUESTION_DESCRIPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
} from '@/features/surveys/config';
import { useQuestionBuilderContext } from '@/features/surveys/hooks/use-question-builder-context';
import { cn } from '@/lib/common/utils';

export function BuilderCenter() {
  const t = useTranslations();
  const { state, activeQuestion, updateQuestion, selectQuestion } = useQuestionBuilderContext();
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeQuestion && !activeQuestion.text) {
      textInputRef.current?.focus();
    }
  }, [activeQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.questions.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <BuilderEmptyState />
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-xs">{t('surveys.builder.noQuestionSelected')}</p>
      </div>
    );
  }

  const showDescription = activeQuestion.description !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {state.questions.map((q, i) => {
            const isStepActive = q.id === activeQuestion.id;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => selectQuestion(q.id)}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors',
                  isStepActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/20'
                )}
                aria-current={isStepActive ? 'step' : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <Input
          ref={textInputRef}
          value={activeQuestion.text}
          onChange={(e) => updateQuestion(activeQuestion.id, { text: e.target.value })}
          placeholder={t('surveys.builder.questionTextPlaceholder')}
          maxLength={QUESTION_TEXT_MAX_LENGTH}
        />

        {showDescription ? (
          <div className="mt-2">
            <Textarea
              value={activeQuestion.description ?? ''}
              onChange={(e) => updateQuestion(activeQuestion.id, { description: e.target.value })}
              placeholder={t('surveys.builder.descriptionPlaceholder')}
              maxLength={QUESTION_DESCRIPTION_MAX_LENGTH}
              className="min-h-[60px] resize-none"
              rows={2}
            />
            <Button
              variant="ghostDestructive"
              size="sm"
              className="mt-1.5"
              onClick={() => updateQuestion(activeQuestion.id, { description: null })}
            >
              <X className="size-4" aria-hidden />
              {t('surveys.builder.removeDescription')}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground mt-2"
            onClick={() => updateQuestion(activeQuestion.id, { description: '' })}
          >
            <Plus className="size-4" aria-hidden />
            {t('surveys.builder.addDescription')}
          </Button>
        )}

        <div className="mt-8">
          <QuestionEditor question={activeQuestion} />
        </div>
      </div>
    </div>
  );
}
