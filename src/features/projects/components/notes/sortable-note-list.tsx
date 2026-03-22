'use client';

import { Fragment, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import type { ProjectNoteMeta } from '@/features/projects/types';
import { useSortableList } from '@/hooks/use-sortable-list';
import { cn } from '@/lib/common/utils';

export interface DragHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  itemIdAttribute: string;
  onReorder: (itemIds: string[]) => void;
  renderItem: (
    item: T,
    dragHandleProps: DragHandleProps | null,
    isDragging: boolean
  ) => React.ReactNode;
  renderGhost: (item: T) => React.ReactNode;
  disabled?: boolean | undefined;
  placeholderClassName?: string | undefined;
  ghostClassName?: string | undefined;
  ghostMinWidth?: number | undefined;
  onDragStart?: ((itemId: string) => void) | undefined;
  onDragEnd?: ((itemId: string, reordered: boolean) => void) | undefined;
}

export function SortableList<T extends { id: string }>({
  items,
  itemIdAttribute,
  onReorder,
  renderItem,
  renderGhost,
  disabled,
  placeholderClassName = 'border-primary/50 bg-primary/5 min-h-10 shrink-0 rounded-lg border border-dashed md:min-h-9',
  ghostClassName = 'bg-background pointer-events-none fixed top-0 left-0 z-50 flex items-center rounded-lg px-2 shadow-lg',
  ghostMinWidth = 200,
  onDragStart,
  onDragEnd,
}: SortableListProps<T>) {
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
    itemIds: items.map((item) => item.id),
    containerRef,
    itemIdAttribute,
    onReorder,
    onDragStart,
    onDragEnd,
  });

  return (
    <>
      <div ref={containerRef}>
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {showPlaceholderAt(index) && <div className={placeholderClassName} aria-hidden />}
            <div
              {...{ [itemIdAttribute]: item.id }}
              className={
                isDragging(item.id)
                  ? 'invisible h-0 min-h-0 overflow-hidden border-none p-0'
                  : undefined
              }
            >
              {renderItem(
                item,
                disabled ? null : { onPointerDown: (e) => handleDragStart(e, item.id) },
                isDragging(item.id)
              )}
            </div>
          </Fragment>
        ))}

        {showPlaceholderAtEnd && <div className={placeholderClassName} aria-hidden />}
      </div>

      {draggedId &&
        ghostPosition &&
        (() => {
          const item = items.find((i) => i.id === draggedId);

          if (!item) {
            return null;
          }

          return createPortal(
            <div
              role="presentation"
              aria-hidden
              className={ghostClassName}
              style={{
                transform: `translate3d(${ghostPosition.x}px, ${ghostPosition.y}px, 0)`,
                width: ghostWidth || 'auto',
                minWidth: ghostMinWidth,
                willChange: 'transform',
              }}
            >
              {renderGhost(item)}
            </div>,
            document.body
          );
        })()}
    </>
  );
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
  onNoteDragStart?: ((noteId: string) => void) | undefined;
  onNoteDragEnd?: ((noteId: string, reordered: boolean) => void) | undefined;
}

export function SortableNoteList({
  notes,
  onReorder,
  renderNote,
  disabled,
  onNoteDragStart,
  onNoteDragEnd,
}: SortableNoteListProps) {
  const t = useTranslations('projects.detail.notes');

  return (
    <SortableList<ProjectNoteMeta>
      items={notes}
      itemIdAttribute="data-note-id"
      onReorder={onReorder}
      renderItem={renderNote}
      disabled={disabled}
      onDragStart={onNoteDragStart}
      onDragEnd={onNoteDragEnd}
      renderGhost={(note) => {
        const displayTitle = note.title || t('untitled');
        const hasTitle = !!note.title;
        const dateStr = new Date(note.updated_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        return (
          <>
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
          </>
        );
      }}
      ghostClassName="bg-background pointer-events-none fixed top-0 left-0 z-50 flex min-h-10 items-center gap-1.5 rounded-lg border pl-2.5 pr-2.5 shadow-lg md:min-h-9"
    />
  );
}
