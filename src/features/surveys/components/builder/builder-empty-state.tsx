'use client';

import { ClipboardList, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

import { useQuestionBuilderContext } from '../../hooks/use-question-builder-context';

export function BuilderEmptyState() {
  const t = useTranslations('surveys.builder.emptyState');
  const { addQuestion } = useQuestionBuilderContext();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
      <EmptyState
        icon={ClipboardList}
        title={t('title')}
        description={t('description')}
        action={
          <Button onClick={() => addQuestion()}>
            <Plus className="size-4" />
            {t('addQuestion')}
          </Button>
        }
      />
    </div>
  );
}
