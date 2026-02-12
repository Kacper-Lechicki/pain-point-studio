'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BUILDER_PANEL_WIDTH_CLASS } from '@/features/dashboard/config/layout';
import { QUESTIONS_MAX } from '@/features/surveys/config';

import { useQuestionBuilderContext } from '../../hooks/use-question-builder-context';
import { BuilderSidebarItem } from './builder-sidebar-item';
import { ResponsivePanel } from './responsive-panel';

interface BuilderSidebarProps {
  /** When true, sidebar renders inline (desktop). When false, renders inside a Sheet (mobile). */
  isDesktop: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function BuilderSidebarContent({ onItemSelect }: { onItemSelect?: (() => void) | undefined }) {
  const t = useTranslations('surveys.builder');
  const { state, addQuestion, selectQuestion, deleteQuestion, moveQuestion } =
    useQuestionBuilderContext();
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  return (
    <>
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <span className="text-muted-foreground text-xs font-medium">
          {t('questionsCount', { count: state.questions.length, max: QUESTIONS_MAX })}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => addQuestion()}
          disabled={state.questions.length >= QUESTIONS_MAX}
          aria-label={t('addQuestion')}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto">
        {state.questions.map((question, index) => (
          <BuilderSidebarItem
            key={question.id}
            question={question}
            index={index}
            isActive={question.id === state.activeQuestionId}
            isFirst={index === 0}
            isLast={index === state.questions.length - 1}
            onSelect={() => {
              selectQuestion(question.id);
              onItemSelect?.();
            }}
            onDelete={() => setDeleteQuestionId(question.id)}
            onMoveUp={() => moveQuestion(question.id, 'up')}
            onMoveDown={() => moveQuestion(question.id, 'down')}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleteQuestionId !== null}
        onOpenChange={(open) => !open && setDeleteQuestionId(null)}
        onConfirm={() => {
          if (deleteQuestionId) {
            deleteQuestion(deleteQuestionId);
            setDeleteQuestionId(null);
          }
        }}
        title={t('deleteQuestionConfirmTitle')}
        description={t('deleteQuestionConfirm')}
        confirmLabel={t('deleteQuestion')}
      />
    </>
  );
}

export function BuilderSidebar({ isDesktop, open, onOpenChange }: BuilderSidebarProps) {
  const t = useTranslations('surveys.builder');

  return (
    <ResponsivePanel
      isDesktop={isDesktop}
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      title={t('questions')}
      desktopClassName={`border-border flex ${BUILDER_PANEL_WIDTH_CLASS} flex-col border-r`}
    >
      <BuilderSidebarContent
        onItemSelect={
          isDesktop
            ? undefined
            : () => {
                onOpenChange?.(false);
              }
        }
      />
    </ResponsivePanel>
  );
}
