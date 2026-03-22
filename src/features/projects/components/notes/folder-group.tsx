'use client';

import { type KeyboardEvent, useRef, useState } from 'react';

import { ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FolderContextMenu } from '@/features/projects/components/notes/folder-context-menu';
import { NoteListItem } from '@/features/projects/components/notes/note-list-item';
import { SortableNoteList } from '@/features/projects/components/notes/sortable-note-list';
import type { ProjectNoteFolder, ProjectNoteMeta } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

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
  isDropTarget?: boolean;
  onNoteDragStart?: ((noteId: string) => void) | undefined;
  onNoteDragEnd?: ((noteId: string, reordered: boolean) => void) | undefined;
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
  isDropTarget = false,
  onNoteDragStart,
  onNoteDragEnd,
}: FolderGroupProps) {
  const t = useTranslations('projects.detail.notes');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => onToggleExpand(folder.id);

  const handleStartRename = () => {
    setRenameValue(folder.name);
    setIsRenaming(true);
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();

    if (trimmed && trimmed !== folder.name) {
      onRenameFolder(folder.id, trimmed);
    }

    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue(folder.name);
    }
  };

  return (
    <div data-drop-folder={folder.id}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={cn(
          'group md:hover:bg-accent/30 flex w-full cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors',
          isDropTarget && 'bg-primary/10'
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

        {!isArchived && !isRenaming && (
          <div
            className="ml-auto shrink-0 opacity-0 md:group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderContextMenu
              onRename={handleStartRename}
              onDelete={() => setConfirmDeleteOpen(true)}
            >
              <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </FolderContextMenu>
          </div>
        )}
      </div>

      {isExpanded && (
        <div>
          <SortableNoteList
            notes={notes}
            onReorder={onReorderNotes}
            disabled={isArchived}
            onNoteDragStart={onNoteDragStart}
            onNoteDragEnd={onNoteDragEnd}
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
        onConfirm={() => {
          onDeleteFolder(folder.id);
          setConfirmDeleteOpen(false);
        }}
        title={t('confirmDeleteFolder')}
        description={t('confirmDeleteFolderDescription')}
        variant="destructive"
      />
    </div>
  );
}
