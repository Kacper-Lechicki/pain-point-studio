'use client';

import { Fragment, useRef } from 'react';

import { Folder, GripVertical } from 'lucide-react';
import { createPortal } from 'react-dom';

import type { DragHandleProps } from '@/features/projects/components/notes/sortable-note-list';
import type { ProjectNoteFolder } from '@/features/projects/types';
import { useSortableList } from '@/hooks/use-sortable-list';

const FOLDER_ID_ATTR = 'data-folder-id';

interface SortableFolderListProps {
  folders: ProjectNoteFolder[];
  onReorder: (folderIds: string[]) => void;
  renderFolder: (
    folder: ProjectNoteFolder,
    dragHandleProps: DragHandleProps | null
  ) => React.ReactNode;
  disabled?: boolean;
}

export function SortableFolderList({
  folders,
  onReorder,
  renderFolder,
  disabled,
}: SortableFolderListProps) {
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
    itemIds: folders.map((f) => f.id),
    containerRef,
    itemIdAttribute: FOLDER_ID_ATTR,
    onReorder,
  });

  return (
    <>
      <div ref={containerRef}>
        {folders.map((folder, index) => (
          <Fragment key={folder.id}>
            {showPlaceholderAt(index) && (
              <div
                className="border-primary/50 bg-primary/5 h-8 shrink-0 rounded-md border border-dashed"
                aria-hidden
              />
            )}
            <div
              {...{ [FOLDER_ID_ATTR]: folder.id }}
              className={
                isDragging(folder.id) ? 'invisible h-0 min-h-0 overflow-hidden p-0' : undefined
              }
            >
              {renderFolder(
                folder,
                disabled ? null : { onPointerDown: (e) => handleDragStart(e, folder.id) }
              )}
            </div>
          </Fragment>
        ))}

        {showPlaceholderAtEnd && (
          <div
            className="border-primary/50 bg-primary/5 h-8 shrink-0 rounded-md border border-dashed"
            aria-hidden
          />
        )}
      </div>

      {draggedId &&
        ghostPosition &&
        (() => {
          const folder = folders.find((f) => f.id === draggedId);

          if (!folder) {
            return null;
          }

          return createPortal(
            <div
              role="presentation"
              aria-hidden
              className="bg-background pointer-events-none fixed top-0 left-0 z-50 flex h-8 items-center gap-1.5 rounded-md px-2.5 shadow-lg"
              style={{
                transform: `translate3d(${ghostPosition.x}px, ${ghostPosition.y}px, 0)`,
                width: ghostWidth || 'auto',
                minWidth: 140,
                willChange: 'transform',
              }}
            >
              <GripVertical className="text-muted-foreground size-3 shrink-0" />
              <Folder className="text-muted-foreground size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">{folder.name}</span>
            </div>,
            document.body
          );
        })()}
    </>
  );
}
