'use client';

import { Fragment, useRef, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BUILDER_PANEL_WIDTH_CLASS } from '@/features/dashboard/config/layout';
import { BuilderSidebarItem } from '@/features/surveys/components/builder/builder-sidebar-item';
import { ResponsivePanel } from '@/features/surveys/components/builder/responsive-panel';
import { QUESTIONS_MAX } from '@/features/surveys/config';
import { QUESTION_TYPE_ICONS } from '@/features/surveys/config';
import { useQuestionBuilderContext } from '@/features/surveys/hooks/use-question-builder-context';
import { useSortableList } from '@/hooks/use-sortable-list';
import { cn } from '@/lib/common/utils';

interface BuilderSidebarProps {
  isDesktop: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ITEM_ID_ATTR = 'data-question-id';

function BuilderSidebarContent({ onItemSelect }: { onItemSelect?: (() => void) | undefined }) {
  const t = useTranslations();

  const { state, addQuestion, selectQuestion, deleteQuestion, reorderQuestions } =
    useQuestionBuilderContext();

  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sortable = useSortableList({
    itemIds: state.questions.map((q) => q.id),
    containerRef: listRef,
    itemIdAttribute: ITEM_ID_ATTR,
    onReorder: (newIds: string[]) => {
      reorderQuestions(newIds);
    },
  });

  const {
    draggedId,
    ghostPosition,
    ghostWidth,
    handleDragStart,
    isDragging,
    showPlaceholderAt,
    showPlaceholderAtEnd,
  } = sortable;

  return (
    <>
      <div className="border-border flex items-center justify-between border-b py-2 pr-2 pl-4">
        <span className="text-muted-foreground text-xs font-medium">
          {t('surveys.builder.questionsCount', {
            count: state.questions.length,
            max: QUESTIONS_MAX,
          })}
        </span>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => addQuestion()}
          disabled={state.questions.length >= QUESTIONS_MAX}
          aria-label={t('surveys.builder.addQuestion')}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {state.questions.map((question, index) => (
          <Fragment key={question.id}>
            {showPlaceholderAt(index) && (
              <div
                className="border-primary/50 bg-primary/5 min-h-10 shrink-0 rounded-lg border border-dashed md:min-h-9"
                aria-hidden
              />
            )}
            <div
              {...{ [ITEM_ID_ATTR]: question.id }}
              className={
                isDragging(question.id)
                  ? 'invisible h-0 min-h-0 overflow-hidden border-none p-0'
                  : undefined
              }
            >
              <BuilderSidebarItem
                question={question}
                index={index}
                isActive={question.id === state.activeQuestionId}
                isDragging={isDragging(question.id)}
                dragHandleProps={{ onPointerDown: (e) => handleDragStart(e, question.id) }}
                onSelect={() => {
                  selectQuestion(question.id);
                  onItemSelect?.();
                }}
                onDelete={() => setDeleteQuestionId(question.id)}
              />
            </div>
          </Fragment>
        ))}

        {showPlaceholderAtEnd && (
          <div
            className="border-primary/50 bg-primary/5 min-h-10 shrink-0 rounded-lg border border-dashed md:min-h-9"
            aria-hidden
          />
        )}
      </div>

      {draggedId &&
        ghostPosition &&
        (() => {
          const question = state.questions.find((q) => q.id === draggedId);

          if (!question) {
            return null;
          }

          const TypeIcon = QUESTION_TYPE_ICONS[question.type];
          const displayText = question.text.trim() || t('surveys.builder.untitledQuestion');
          const index = state.questions.findIndex((q) => q.id === draggedId);

          return createPortal(
            <div
              role="presentation"
              aria-hidden
              className="bg-background pointer-events-none fixed top-0 left-0 z-50 flex min-h-10 items-center gap-2 rounded-lg px-2 shadow-lg md:min-h-9"
              style={{
                transform: `translate3d(${ghostPosition.x}px, ${ghostPosition.y}px, 0)`,
                width: ghostWidth || 'auto',
                minWidth: 200,
                willChange: 'transform',
              }}
            >
              <span className="text-muted-foreground size-4 shrink-0" />

              <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
                {index + 1}.
              </span>

              <TypeIcon className="text-muted-foreground size-4 shrink-0" />

              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-xs',
                  question.text.trim() ? 'text-foreground' : 'text-muted-foreground italic'
                )}
              >
                {displayText}
              </span>

              <span className="size-9 shrink-0" />
            </div>,
            document.body
          );
        })()}

      <ConfirmDialog
        open={deleteQuestionId !== null}
        onOpenChange={(open) => !open && setDeleteQuestionId(null)}
        onConfirm={() => {
          if (deleteQuestionId) {
            deleteQuestion(deleteQuestionId);
            setDeleteQuestionId(null);
          }
        }}
        title={t('surveys.builder.deleteQuestionConfirmTitle')}
        description={t('surveys.builder.deleteQuestionConfirm')}
        confirmLabel={t('surveys.builder.deleteQuestion')}
      />
    </>
  );
}

export function BuilderSidebar({ isDesktop, open, onOpenChange }: BuilderSidebarProps) {
  const t = useTranslations();

  return (
    <ResponsivePanel
      isDesktop={isDesktop}
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      title={t('surveys.builder.questions')}
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
