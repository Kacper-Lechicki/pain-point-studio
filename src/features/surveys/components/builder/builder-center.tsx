'use client';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  QUESTION_DESCRIPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
} from '@/features/surveys/config';
import { cn } from '@/lib/common/utils';

import { useQuestionBuilderContext } from '../../hooks/use-question-builder-context';
import { BuilderEmptyState } from './builder-empty-state';
import { QuestionEditor } from './editors/question-editor';

export function BuilderCenter() {
  const t = useTranslations('surveys.builder');
  const { state, activeQuestion, updateQuestion, selectQuestion } = useQuestionBuilderContext();
  const textInputRef = useRef<HTMLInputElement>(null);
  const [showRemoveDescriptionConfirm, setShowRemoveDescriptionConfirm] = useState(false);

  // Auto-focus when a new question is added (empty text = freshly created)
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
        <p className="text-muted-foreground text-sm">{t('noQuestionSelected')}</p>
      </div>
    );
  }

  const showDescription = activeQuestion.description !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Step indicator */}
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

        {/* Question text */}
        <Input
          ref={textInputRef}
          value={activeQuestion.text}
          onChange={(e) => updateQuestion(activeQuestion.id, { text: e.target.value })}
          placeholder={t('questionTextPlaceholder')}
          maxLength={QUESTION_TEXT_MAX_LENGTH}
        />

        {/* Description */}
        {showDescription ? (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <Textarea
                value={activeQuestion.description ?? ''}
                onChange={(e) => updateQuestion(activeQuestion.id, { description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                maxLength={QUESTION_DESCRIPTION_MAX_LENGTH}
                className="min-h-[60px] resize-none"
                rows={2}
              />
            </div>
            <Button
              variant="ghostDestructive"
              size="sm"
              className="mt-3"
              onClick={() => setShowRemoveDescriptionConfirm(true)}
            >
              {t('removeDescription')}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => updateQuestion(activeQuestion.id, { description: '' })}
          >
            + {t('addDescription')}
          </Button>
        )}

        {/* WYSIWYG answer preview */}
        <div className="mt-8">
          <QuestionEditor question={activeQuestion} />
        </div>
      </div>

      <ConfirmDialog
        open={showRemoveDescriptionConfirm}
        onOpenChange={setShowRemoveDescriptionConfirm}
        onConfirm={() => {
          updateQuestion(activeQuestion.id, { description: null });
          setShowRemoveDescriptionConfirm(false);
        }}
        title={t('removeDescriptionConfirmTitle')}
        description={t('removeDescriptionConfirm')}
        confirmLabel={t('removeDescription')}
      />
    </div>
  );
}
