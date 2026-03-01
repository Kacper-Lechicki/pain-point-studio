'use client';

import { Fragment, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import type { ProjectNoteMeta } from '@/features/projects/types';
import { useSortableList } from '@/hooks/use-sortable-list';
import { cn } from '@/lib/common/utils';

const NOTE_ID_ATTR = 'data-note-id';

export interface DragHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
}

interface SortableNoteListProps {
  notes: ProjectNoteMeta[];
  onReorder: (noteIds: string[]) => void;
  renderNote: (
    note: ProjectNoteMeta,
    dragHandleProps: DragHandleProps | null,
    isDragging: boolean
  ) => React.ReactNode;
  disabled?: boolean;
}

export function SortableNoteList({
  notes,
  onReorder,
  renderNote,
  disabled,
}: SortableNoteListProps) {
  const t = useTranslations('projects.detail.notes');
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    draggedId,
    ghostPosition,
    ghostWidth,
    handleDragStart,
    isDragging,
    showPlaceholderAt,
    showPlaceholderAtEnd,
  } = useSortableList({
    itemIds: notes.map((n) => n.id),
    containerRef,
    itemIdAttribute: NOTE_ID_ATTR,
    onReorder,
  });

  return (
    <>
      <div ref={containerRef}>
        {notes.map((note, index) => (
          <Fragment key={note.id}>
            {showPlaceholderAt(index) && (
              <div
                className="border-primary/50 bg-primary/5 min-h-10 shrink-0 rounded-lg border border-dashed md:min-h-9"
                aria-hidden
              />
            )}
            <div
              {...{ [NOTE_ID_ATTR]: note.id }}
              className={
                isDragging(note.id)
                  ? 'invisible h-0 min-h-0 overflow-hidden border-none p-0'
                  : undefined
              }
            >
              {renderNote(
                note,
                disabled ? null : { onPointerDown: (e) => handleDragStart(e, note.id) },
                isDragging(note.id)
              )}
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
          const note = notes.find((n) => n.id === draggedId);

          if (!note) {
            return null;
          }

          const displayTitle = note.title || t('untitled');
          const hasTitle = !!note.title;
          const dateStr = new Date(note.updated_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

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

              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-xs',
                  hasTitle ? 'text-foreground' : 'text-muted-foreground italic'
                )}
              >
                {displayTitle}
              </span>

              <span className="text-muted-foreground shrink-0 text-xs">{dateStr}</span>

              <span className="size-9 shrink-0" />
            </div>,
            document.body
          );
        })()}
    </>
  );
}
