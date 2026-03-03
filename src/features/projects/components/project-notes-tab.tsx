'use client';

import { useCallback, useEffect, useRef } from 'react';

import type { JSONContent } from '@tiptap/react';

import { NoteEditor } from '@/features/projects/components/notes/note-editor';
import { NotesLayout } from '@/features/projects/components/notes/notes-layout';
import { NotesSidebar } from '@/features/projects/components/notes/notes-sidebar';
import { useNoteAutoSave } from '@/features/projects/hooks/use-note-auto-save';
import { useNotesState } from '@/features/projects/hooks/use-notes-state';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectNoteFolder, ProjectNoteMeta } from '@/features/projects/types';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

interface ProjectNotesTabProps {
  project: Project;
  initialNotes: ProjectNoteMeta[];
  initialFolders: ProjectNoteFolder[];
}

export function ProjectNotesTab({ project, initialNotes, initialFolders }: ProjectNotesTabProps) {
  const archived = isProjectArchived(project);
  const isDesktop = useBreakpoint('md');
  const autoCreatedRef = useRef(false);

  const state = useNotesState({
    projectId: project.id,
    initialNotes,
    initialFolders,
  });

  const {
    selectedNoteId,
    noteContent,
    isLoadingContent,
    activeNotes,
    handleContentChange: handleStateContentChange,
    handleTitleExtracted,
    handleCreateNote,
    setSelectedNoteId,
  } = state;

  const { saveStatus, handleContentChange: handleAutoSaveChange } = useNoteAutoSave({
    noteId: selectedNoteId,
    onTitleExtracted: handleTitleExtracted,
  });

  const handleEditorChange = useCallback(
    (json: JSONContent) => {
      handleStateContentChange(json);
      handleAutoSaveChange(json);
    },
    [handleStateContentChange, handleAutoSaveChange]
  );

  const activeNotesLength = activeNotes.length;

  useEffect(() => {
    if (!archived && activeNotesLength === 0 && !autoCreatedRef.current) {
      autoCreatedRef.current = true;
      void handleCreateNote();
    }
  }, [archived, activeNotesLength, handleCreateNote]);

  const handleBack = useCallback(() => {
    setSelectedNoteId(null);
  }, [setSelectedNoteId]);

  const showEditor = isDesktop || !!selectedNoteId;

  return (
    <NotesLayout
      sidebar={<NotesSidebar state={state} isArchived={archived} />}
      editor={
        <NoteEditor
          noteId={selectedNoteId}
          content={noteContent}
          isLoading={isLoadingContent}
          saveStatus={saveStatus}
          editable={!archived}
          onContentChange={handleEditorChange}
          onBack={handleBack}
        />
      }
      showEditor={showEditor}
      onBack={handleBack}
    />
  );
}
