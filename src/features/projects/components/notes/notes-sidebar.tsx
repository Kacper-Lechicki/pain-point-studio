'use client';

import { useCallback, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { SearchInput } from '@/components/ui/search-input';
import { FolderGroup } from '@/features/projects/components/notes/folder-group';
import { NewFolderInput } from '@/features/projects/components/notes/new-folder-input';
import { NewNoteInput } from '@/features/projects/components/notes/new-note-input';
import { NoteListItem } from '@/features/projects/components/notes/note-list-item';
import { NotesSection } from '@/features/projects/components/notes/notes-section';
import { NotesTrashSection } from '@/features/projects/components/notes/notes-trash-section';
import { SortableFolderList } from '@/features/projects/components/notes/sortable-folder-list';
import { SortableNoteList } from '@/features/projects/components/notes/sortable-note-list';
import type { NotesState } from '@/features/projects/hooks/use-notes-state';

interface NotesSidebarProps {
  state: NotesState;
  isArchived: boolean;
}

export function NotesSidebar({ state, isArchived }: NotesSidebarProps) {
  const t = useTranslations('projects.detail.notes');

  const { setSelectedNoteId } = state;
  const handleSelectNote = useCallback(
    (noteId: string) => {
      setSelectedNoteId(noteId);
    },
    [setSelectedNoteId]
  );

  const noteActions = useMemo(
    () =>
      isArchived
        ? {}
        : {
            folders: state.folders,
            onPin: state.handleTogglePin,
            onDuplicate: state.handleDuplicateNote,
            onMoveToFolder: state.handleMoveToFolder,
            onDelete: state.handleDeleteNote,
          },
    [
      isArchived,
      state.folders,
      state.handleTogglePin,
      state.handleDuplicateNote,
      state.handleMoveToFolder,
      state.handleDeleteNote,
    ]
  );

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
          action={!isArchived ? <NewFolderInput onCreate={state.handleCreateFolder} /> : undefined}
        >
          {state.folders.length > 0 ? (
            <SortableFolderList
              folders={state.folders}
              onReorder={state.handleReorderFolders}
              disabled={isArchived}
              renderFolder={(folder, folderDragHandleProps) => (
                <FolderGroup
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
                  dragHandleProps={folderDragHandleProps}
                />
              )}
            />
          ) : null}
        </NotesSection>

        {state.unfiledNotes.length > 0 && (
          <NotesSection title={t('unfiled')} count={state.unfiledNotes.length}>
            <SortableNoteList
              notes={state.unfiledNotes}
              onReorder={state.handleReorderNotes}
              disabled={isArchived}
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

        <NotesTrashSection
          notes={state.trashedNotes}
          isArchived={isArchived}
          selectedNoteId={state.selectedNoteId}
          onSelectNote={handleSelectNote}
          onRestore={state.handleRestoreNote}
          onPermanentlyDelete={state.handlePermanentlyDelete}
          onEmptyTrash={state.handleEmptyTrash}
        />
      </div>
    </div>
  );
}
