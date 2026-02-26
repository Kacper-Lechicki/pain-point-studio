'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Eye, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateProjectNotes } from '@/features/projects/actions/update-project-notes';
import { MarkdownPreview } from '@/features/projects/components/markdown-preview';
import { PROJECT_NOTES_DEBOUNCE_MS, PROJECT_NOTES_MAX_LENGTH } from '@/features/projects/config';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface ProjectNotesTabProps {
  project: Project;
}

export function ProjectNotesTab({ project }: ProjectNotesTabProps) {
  const t = useTranslations('projects.detail.notes');
  const archived = isProjectArchived(project);

  const [content, setContent] = useState(project.notes ?? '');
  const [mode, setMode] = useState<'edit' | 'preview'>(archived ? 'preview' : 'edit');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(project.notes ?? '');

  const save = useCallback(
    async (value: string) => {
      setSaveStatus('saving');

      const result = await updateProjectNotes({
        projectId: project.id,
        notes: value,
      });

      if (result.success) {
        lastSavedRef.current = value;
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
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (value === lastSavedRef.current) {
        setSaveStatus(lastSavedRef.current === (project.notes ?? '') ? 'idle' : 'saved');

        return;
      }

      setSaveStatus('idle');
      timerRef.current = setTimeout(() => save(value), PROJECT_NOTES_DEBOUNCE_MS);
    },
    [save, project.notes]
  );

  // Cleanup timers on unmount
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
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Edit / Preview toggle */}
        {!archived && (
          <div className="flex gap-1">
            <Button
              variant={mode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('edit')}
            >
              <Pencil className="size-3.5" aria-hidden />
              {t('edit')}
            </Button>
            <Button
              variant={mode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('preview')}
            >
              <Eye className="size-3.5" aria-hidden />
              {t('preview')}
            </Button>
          </div>
        )}

        {archived && <div />}

        {/* Save status */}
        {!archived && (
          <div className="text-sm">
            {saveStatus === 'saving' && (
              <span className="text-muted-foreground">{t('saving')}</span>
            )}
            {saveStatus === 'saved' && <span className="text-muted-foreground">{t('saved')}</span>}
            {saveStatus === 'failed' && <span className="text-destructive">{t('failed')}</span>}
          </div>
        )}
      </div>

      {/* Editor / Preview */}
      {mode === 'edit' ? (
        <Textarea
          value={content}
          onChange={handleChange}
          placeholder={t('placeholder')}
          maxLength={PROJECT_NOTES_MAX_LENGTH}
          className="min-h-[400px] font-mono text-[15px] leading-relaxed"
        />
      ) : (
        <div className="border-border bg-background min-h-[400px] rounded-md border px-4 py-3">
          {content.trim() ? (
            <MarkdownPreview content={content} />
          ) : (
            <p className="text-muted-foreground text-sm">{t('emptyPreview')}</p>
          )}
        </div>
      )}
    </div>
  );
}
