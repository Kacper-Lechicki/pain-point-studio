'use client';

import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

import { ChevronRight, Folder, GripVertical, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { ProjectNoteFolder, ProjectNoteMeta } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

import { FolderContextMenu } from './folder-context-menu';
import { NoteListItem } from './note-list-item';
import { SortableNoteList } from './sortable-note-list';
import type { DragHandleProps } from './sortable-note-list';

interface NoteActions {
  folders?: ProjectNoteFolder[];
  onPin?: (noteId: string, isPinned: boolean) => void;
  onDuplicate?: (noteId: string) => void;
  onMoveToFolder?: (noteId: string, folderId: string | null) => void;
  onDelete?: (noteId: string) => void;
}

interface FolderGroupProps {
  folder: ProjectNoteFolder;
  notes: ProjectNoteMeta[];
  isExpanded: boolean;
  isArchived: boolean;
  selectedNoteId: string | null;
  noteActions: NoteActions;
  onToggleExpand: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onReorderNotes: (noteIds: string[]) => void;
  dragHandleProps?: DragHandleProps | null;
}

export function FolderGroup({
  folder,
  notes,
  isExpanded,
  isArchived,
  selectedNoteId,
  noteActions,
  onToggleExpand,
  onSelectNote,
  onRenameFolder,
  onDeleteFolder,
  onReorderNotes,
  dragHandleProps,
}: FolderGroupProps) {
  const t = useTranslations('projects.detail.notes');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback(() => {
    onToggleExpand(folder.id);
  }, [onToggleExpand, folder.id]);

  const handleStartRename = useCallback(() => {
    setRenameValue(folder.name);
    setIsRenaming(true);
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }, [folder.name]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();

    if (trimmed && trimmed !== folder.name) {
      onRenameFolder(folder.id, trimmed);
    }

    setIsRenaming(false);
  }, [renameValue, folder.id, folder.name, onRenameFolder]);

  const handleRenameKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRenameSubmit();
      } else if (e.key === 'Escape') {
        setIsRenaming(false);
        setRenameValue(folder.name);
      }
    },
    [handleRenameSubmit, folder.name]
  );

  const handleConfirmDelete = useCallback(() => {
    onDeleteFolder(folder.id);
    setConfirmDeleteOpen(false);
  }, [onDeleteFolder, folder.id]);

  return (
    <div>
      {/* Folder header */}
      <div className="group flex items-center gap-0.5 px-1">
        {dragHandleProps && (
          <span
            className="text-muted-foreground flex shrink-0 cursor-grab touch-none opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              dragHandleProps.onPointerDown(e);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            role="button"
            tabIndex={-1}
          >
            <GripVertical className="size-3" aria-hidden />
          </span>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm transition-colors',
            'hover:bg-accent/50'
          )}
        >
          <ChevronRight
            className={cn(
              'text-muted-foreground size-3 shrink-0 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
          <Folder className="text-muted-foreground size-3.5 shrink-0" />

          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="bg-accent min-w-0 flex-1 rounded px-1 py-0 text-sm outline-none"
            />
          ) : (
            <span className="min-w-0 truncate">{folder.name}</span>
          )}

          {notes.length > 0 && !isRenaming && (
            <span className="text-muted-foreground/70 text-xs tabular-nums">({notes.length})</span>
          )}
        </button>

        {!isArchived && !isRenaming && (
          <FolderContextMenu
            onRename={handleStartRename}
            onDelete={() => setConfirmDeleteOpen(true)}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </FolderContextMenu>
        )}
      </div>

      {/* Folder notes with D&D */}
      {isExpanded && (
        <div className="pl-4">
          <SortableNoteList
            notes={notes}
            onReorder={onReorderNotes}
            disabled={isArchived}
            renderNote={(note, noteDragHandleProps, noteDragging) => (
              <NoteListItem
                note={note}
                isSelected={selectedNoteId === note.id}
                isDragging={noteDragging}
                dragHandleProps={noteDragHandleProps}
                onClick={onSelectNote}
                {...noteActions}
              />
            )}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title={t('confirmDeleteFolder')}
        description={t('confirmDeleteFolderDescription')}
        variant="destructive"
      />
    </div>
  );
}
