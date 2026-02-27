'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';
import { useTranslations } from 'next-intl';

import { RichEditor } from '@/components/shared/rich-editor/rich-editor';
import { updateProjectNotes } from '@/features/projects/actions/update-project-notes';
import { PROJECT_NOTES_DEBOUNCE_MS } from '@/features/projects/config';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface ProjectNotesTabProps {
  project: Project;
}

export function ProjectNotesTab({ project }: ProjectNotesTabProps) {
  const t = useTranslations('projects.detail.notes');
  const archived = isProjectArchived(project);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (json: JSONContent) => {
      setSaveStatus('saving');

      const result = await updateProjectNotes({
        projectId: project.id,
        notes: json,
      });

      if (result.success) {
        setSaveStatus('saved');

        if (savedFadeRef.current) {
          clearTimeout(savedFadeRef.current);
        }

        savedFadeRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('failed');
      }
    },
    [project.id]
  );

  const handleChange = useCallback(
    (json: JSONContent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setSaveStatus('idle');
      timerRef.current = setTimeout(() => save(json), PROJECT_NOTES_DEBOUNCE_MS);
    },
    [save]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (savedFadeRef.current) {
        clearTimeout(savedFadeRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Save status */}
      {!archived && saveStatus !== 'idle' && (
        <div className="flex justify-end text-sm">
          <span className={saveStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>
            {saveStatus === 'saving' && t('saving')}
            {saveStatus === 'saved' && t('saved')}
            {saveStatus === 'failed' && t('failed')}
          </span>
        </div>
      )}

      <RichEditor
        content={project.notes_json as JSONContent | null}
        onChange={handleChange}
        placeholder={t('placeholder')}
        editable={!archived}
      />
    </div>
  );
}
