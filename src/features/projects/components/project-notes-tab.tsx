'use client';

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

  const state = useNotesState({
    projectId: project.id,
    initialNotes,
    initialFolders,
  });

  const {
    selectedNoteId,
    noteContent,
    isLoadingContent,
    handleContentChange: handleStateContentChange,
    handleTitleExtracted,
    setSelectedNoteId,
    ensureSelectedVisible,
  } = state;

  const { saveStatus, handleContentChange: handleAutoSaveChange } = useNoteAutoSave({
    noteId: selectedNoteId,
    onTitleExtracted: handleTitleExtracted,
  });

  const handleEditorChange = (json: JSONContent) => {
    handleStateContentChange(json);
    handleAutoSaveChange(json);
  };

  const handleBack = () => {
    setSelectedNoteId(null);
  };

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
          onFocus={ensureSelectedVisible}
        />
      }
      showEditor={showEditor}
      onBack={handleBack}
    />
  );
}
