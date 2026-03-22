'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { ChevronRight, MoreVertical, RotateCcw, StickyNote, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { FolderGroup } from '@/features/projects/components/notes/folder-group';
import {
  NewFolderButton,
  NewFolderField,
  useNewFolder,
} from '@/features/projects/components/notes/new-folder-input';
import { NewNoteInput } from '@/features/projects/components/notes/new-note-input';
import { NoteListItem } from '@/features/projects/components/notes/note-list-item';
import { NotesSection } from '@/features/projects/components/notes/notes-section';
import { SortableNoteList } from '@/features/projects/components/notes/sortable-note-list';
import type { NotesState } from '@/features/projects/hooks/use-notes-state';
import type { ProjectNoteMeta } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

interface NotesSidebarProps {
  state: NotesState;
  isArchived: boolean;
}

type DropTarget = { type: 'folder'; id: string } | { type: 'unfiled' } | { type: 'trash' } | null;

function detectDropTarget(clientX: number, clientY: number): DropTarget {
  const el = document.elementFromPoint(clientX, clientY);

  if (!el) {
    return null;
  }

  const folderEl = (el as HTMLElement).closest<HTMLElement>('[data-drop-folder]');

  if (folderEl) {
    return { type: 'folder', id: folderEl.dataset.dropFolder! };
  }

  const zoneEl = (el as HTMLElement).closest<HTMLElement>('[data-drop-zone]');

  if (zoneEl) {
    const zone = zoneEl.dataset.dropZone;

    if (zone === 'unfiled' || zone === 'trash') {
      return { type: zone };
    }
  }

  return null;
}

function getNoteSourceZone(note: ProjectNoteMeta): DropTarget {
  if (note.deleted_at) {
    return { type: 'trash' };
  }

  if (note.folder_id) {
    return { type: 'folder', id: note.folder_id };
  }

  return { type: 'unfiled' };
}

function isSameZone(a: DropTarget, b: DropTarget): boolean {
  if (!a || !b) {
    return false;
  }

  if (a.type !== b.type) {
    return false;
  }

  if (a.type === 'folder' && b.type === 'folder') {
    return a.id === b.id;
  }

  return true;
}

interface FolderHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  isDropTarget?: boolean | undefined;
  action?: React.ReactNode;
}

function FolderHeader({
  icon: Icon,
  label,
  count,
  isExpanded,
  onToggle,
  isDropTarget = false,
  action,
}: FolderHeaderProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
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
      <Icon className="text-muted-foreground size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>

      {count > 0 && (
        <span className="text-muted-foreground/70 text-xs tabular-nums">({count})</span>
      )}

      {action && (
        <div
          className="ml-auto shrink-0 opacity-0 md:group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      )}
    </div>
  );
}

interface TrashNoteMenuProps {
  noteId: string;
  onRestore: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

function TrashNoteMenu({ noteId, onRestore, onDelete }: TrashNoteMenuProps) {
  const t = useTranslations('projects.detail.notes');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onRestore(noteId)}>
          <RotateCcw className="size-4" />
          {t('restore')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(noteId)}>
          <Trash2 className="size-4" />
          {t('permanentlyDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NotesSidebar({ state, isArchived }: NotesSidebarProps) {
  const t = useTranslations('projects.detail.notes');
  const newFolder = useNewFolder(state.handleCreateFolder);

  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const dropTargetRef = useRef<DropTarget>(null);
  const draggingNoteRef = useRef<ProjectNoteMeta | null>(null);

  const [unfiledExpanded, setUnfiledExpanded] = useState(true);
  const [trashExpanded, setTrashExpanded] = useState(false);
  const [confirmEmptyTrashOpen, setConfirmEmptyTrashOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [prevSelectedNoteId, setPrevSelectedNoteId] = useState(state.selectedNoteId);
  const [prevRevealTrigger, setPrevRevealTrigger] = useState(state.revealTrigger);

  if (
    state.selectedNoteId &&
    (state.selectedNoteId !== prevSelectedNoteId || state.revealTrigger !== prevRevealTrigger)
  ) {
    setPrevSelectedNoteId(state.selectedNoteId);
    setPrevRevealTrigger(state.revealTrigger);

    const isUnfiled = state.unfiledNotes.some((n) => n.id === state.selectedNoteId);

    if (isUnfiled && !unfiledExpanded) {
      setUnfiledExpanded(true);
    }
  }

  if (!state.selectedNoteId && prevSelectedNoteId) {
    setPrevSelectedNoteId(null);
  }

  const sortedFolders = useMemo(
    () => [...state.folders].sort((a, b) => a.name.localeCompare(b.name)),
    [state.folders]
  );

  const findNote = (noteId: string): ProjectNoteMeta | null => {
    for (const n of state.pinnedNotes) {
      if (n.id === noteId) {
        return n;
      }
    }

    for (const n of state.unfiledNotes) {
      if (n.id === noteId) {
        return n;
      }
    }

    for (const f of state.folders) {
      for (const n of state.getNotesByFolder(f.id)) {
        if (n.id === noteId) {
          return n;
        }
      }
    }

    return null;
  };

  const handleNoteDragStart = (noteId: string) => {
    draggingNoteRef.current = findNote(noteId);
    setDraggingNoteId(noteId);
  };

  const handleNoteDragEnd = (noteId: string, reordered: boolean) => {
    const target = dropTargetRef.current;
    const sourceNote = draggingNoteRef.current;

    if (!reordered && target && sourceNote) {
      const source = getNoteSourceZone(sourceNote);

      if (!isSameZone(source, target)) {
        if (target.type === 'folder') {
          void state.handleMoveToFolder(noteId, target.id);
        } else if (target.type === 'unfiled') {
          void state.handleMoveToFolder(noteId, null);
        } else if (target.type === 'trash') {
          void state.handleDeleteNote(noteId);
        }
      }
    }

    setDraggingNoteId(null);
    setDropTarget(null);
    dropTargetRef.current = null;
    draggingNoteRef.current = null;
  };

  useEffect(() => {
    if (!draggingNoteId) {
      return;
    }

    const onMove = (e: PointerEvent) => {
      const target = detectDropTarget(e.clientX, e.clientY);

      const prev = dropTargetRef.current;
      const changed =
        target?.type !== prev?.type ||
        (target?.type === 'folder' && prev?.type === 'folder' && target.id !== prev.id);

      if (changed) {
        dropTargetRef.current = target;
        setDropTarget(target);
      }
    };

    window.addEventListener('pointermove', onMove, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove, true);
    };
  }, [draggingNoteId]);

  const { setSelectedNoteId } = state;
  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const noteActions = isArchived
    ? {}
    : {
        folders: state.folders,
        onPin: state.handleTogglePin,
        onDuplicate: state.handleDuplicateNote,
        onMoveToFolder: state.handleMoveToFolder,
        onDelete: state.handleDeleteNote,
      };

  const isDropTargetFolder = (folderId: string) =>
    dropTarget?.type === 'folder' && dropTarget.id === folderId;

  const handleEmptyTrash = () => {
    void state.handleEmptyTrash();
    setConfirmEmptyTrashOpen(false);
  };

  const handlePermanentlyDelete = () => {
    if (confirmDeleteId) {
      void state.handlePermanentlyDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const renderTrashNoteMenu = (note: ProjectNoteMeta) =>
    !isArchived ? (
      <TrashNoteMenu
        noteId={note.id}
        onRestore={state.handleRestoreNote}
        onDelete={setConfirmDeleteId}
      />
    ) : undefined;

  const trashAction =
    !isArchived && state.trashedNotes.length > 0 ? (
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground md:hover:text-destructive"
        onClick={() => setConfirmEmptyTrashOpen(true)}
      >
        <Trash2 className="size-3" />
      </Button>
    ) : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-1.5 border-b p-2">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={state.searchQuery}
            onChange={state.setSearchQuery}
            placeholder={t('searchPlaceholder')}
            size="sm"
          />
        </div>
        {!isArchived && <NewNoteInput onCreate={state.handleCreateNote} />}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {state.pinnedNotes.length > 0 && (
          <NotesSection title={t('pinned')} count={state.pinnedNotes.length}>
            <SortableNoteList
              notes={state.pinnedNotes}
              onReorder={state.handleReorderNotes}
              disabled={isArchived}
              onNoteDragStart={handleNoteDragStart}
              onNoteDragEnd={handleNoteDragEnd}
              renderNote={(note, dragHandleProps, noteDragging) => (
                <NoteListItem
                  note={note}
                  isSelected={state.selectedNoteId === note.id}
                  isDragging={noteDragging}
                  dragHandleProps={dragHandleProps}
                  onClick={handleSelectNote}
                  {...noteActions}
                />
              )}
            />
          </NotesSection>
        )}

        <NotesSection
          title={t('folders')}
          collapsible={false}
          action={!isArchived ? <NewFolderButton onClick={newFolder.expand} /> : undefined}
        >
          {newFolder.isExpanded && <NewFolderField inputProps={newFolder.inputProps} />}

          {sortedFolders.map((folder) => (
            <FolderGroup
              key={folder.id}
              folder={folder}
              notes={state.getNotesByFolder(folder.id)}
              isExpanded={state.expandedFolderIds.includes(folder.id)}
              isArchived={isArchived}
              selectedNoteId={state.selectedNoteId}
              noteActions={noteActions}
              onToggleExpand={state.toggleFolderExpanded}
              onSelectNote={handleSelectNote}
              onRenameFolder={state.handleRenameFolder}
              onDeleteFolder={state.handleDeleteFolder}
              onReorderNotes={state.handleReorderNotes}
              isDropTarget={isDropTargetFolder(folder.id)}
              onNoteDragStart={handleNoteDragStart}
              onNoteDragEnd={handleNoteDragEnd}
            />
          ))}

          <div data-drop-zone="unfiled">
            <FolderHeader
              icon={StickyNote}
              label={t('unfiled')}
              count={state.unfiledNotes.length}
              isExpanded={unfiledExpanded}
              onToggle={() => setUnfiledExpanded((v) => !v)}
              isDropTarget={dropTarget?.type === 'unfiled'}
            />

            {unfiledExpanded && (
              <div>
                <SortableNoteList
                  notes={state.unfiledNotes}
                  onReorder={state.handleReorderNotes}
                  disabled={isArchived}
                  onNoteDragStart={handleNoteDragStart}
                  onNoteDragEnd={handleNoteDragEnd}
                  renderNote={(note, dragHandleProps, noteDragging) => (
                    <NoteListItem
                      note={note}
                      isSelected={state.selectedNoteId === note.id}
                      isDragging={noteDragging}
                      dragHandleProps={dragHandleProps}
                      onClick={handleSelectNote}
                      {...noteActions}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div data-drop-zone="trash">
            <FolderHeader
              icon={Trash2}
              label={t('trash')}
              count={state.trashedNotes.length}
              isExpanded={trashExpanded}
              onToggle={() => setTrashExpanded((v) => !v)}
              isDropTarget={dropTarget?.type === 'trash'}
              action={trashAction}
            />

            {trashExpanded && (
              <div>
                {state.trashedNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={state.selectedNoteId === note.id}
                    onClick={handleSelectNote}
                    className="opacity-60"
                    menuSlot={renderTrashNoteMenu(note)}
                  />
                ))}
              </div>
            )}
          </div>
        </NotesSection>
      </div>

      <ConfirmDialog
        open={confirmEmptyTrashOpen}
        onOpenChange={setConfirmEmptyTrashOpen}
        onConfirm={handleEmptyTrash}
        title={t('confirmEmptyTrash')}
        description={t('confirmEmptyTrashDescription')}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={handlePermanentlyDelete}
        title={t('confirmPermanentDelete')}
        description={t('confirmPermanentDeleteDescription')}
        variant="destructive"
      />
    </div>
  );
}
