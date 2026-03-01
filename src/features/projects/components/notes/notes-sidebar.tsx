'use client';

import { useCallback, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { SearchInput } from '@/components/ui/search-input';
import type { NotesState } from '@/features/projects/hooks/use-notes-state';

import { FolderGroup } from './folder-group';
import { NewFolderInput } from './new-folder-input';
import { NewNoteInput } from './new-note-input';
import { NoteListItem } from './note-list-item';
import { NotesSection } from './notes-section';
import { NotesTrashSection } from './notes-trash-section';
import { SortableFolderList } from './sortable-folder-list';
import { SortableNoteList } from './sortable-note-list';

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

  // Note action props — only provided when not archived
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
      {/* Header: search + add note */}
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Pinned section */}
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

        {/* Folders section — always visible */}
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

        {/* Unfiled notes section */}
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

        {/* Trash section */}
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
