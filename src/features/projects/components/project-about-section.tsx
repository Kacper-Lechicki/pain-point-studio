'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RichEditor } from '@/components/shared/rich-editor/rich-editor';
import { tiptapJsonToPlainText } from '@/components/shared/rich-editor/utils';
import { updateProjectDescription } from '@/features/projects/actions/update-project-description';
import { PROJECT_DESCRIPTION_DEBOUNCE_MS } from '@/features/projects/config';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface ProjectAboutSectionProps {
  project: Project;
}

export function ProjectAboutSection({ project }: ProjectAboutSectionProps) {
  const t = useTranslations('projects.detail.about');
  const archived = isProjectArchived(project);

  const [expanded, setExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<JSONContent | null>(
    (project.description as JSONContent | null) ?? null
  );

  const plainExcerpt = tiptapJsonToPlainText(project.description as JSONContent | null);

  const save = useCallback(
    async (json: JSONContent) => {
      setSaveStatus('saving');

      const result = await updateProjectDescription({
        projectId: project.id,
        description: json,
      });

      if (result.success) {
        lastSavedRef.current = json;
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
      timerRef.current = setTimeout(() => save(json), PROJECT_DESCRIPTION_DEBOUNCE_MS);
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
    <div className="flex flex-col">
      <button
        type="button"
        className="flex items-center gap-1.5 py-1 text-sm font-medium"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown className="text-muted-foreground size-4" aria-hidden />
        ) : (
          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        )}
        <span>{t('title')}</span>

        {!expanded && plainExcerpt && (
          <span className="text-muted-foreground ml-1 max-w-[40ch] truncate text-xs font-normal">
            {plainExcerpt}
          </span>
        )}

        {expanded && !archived && saveStatus !== 'idle' && (
          <span
            className={`ml-auto text-xs font-normal ${
              saveStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {saveStatus === 'saving' && t('saving')}
            {saveStatus === 'saved' && t('saved')}
            {saveStatus === 'failed' && t('failed')}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2">
          <RichEditor
            content={project.description as JSONContent | null}
            onChange={handleChange}
            placeholder={t('placeholder')}
            editable={!archived}
          />
        </div>
      )}
    </div>
  );
}
