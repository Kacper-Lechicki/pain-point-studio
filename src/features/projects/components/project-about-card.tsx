'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';
import { Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RichEditor } from '@/components/shared/rich-editor/rich-editor';
import { isTiptapEmpty } from '@/components/shared/rich-editor/utils';
import { Button } from '@/components/ui/button';
import { updateProjectDescription } from '@/features/projects/actions/update-project-description';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

/** Max height (px) before fade + "show more" kicks in. */
const PREVIEW_MAX_H = 400;

interface ProjectAboutCardProps {
  project: Project;
}

export function ProjectAboutCard({ project }: ProjectAboutCardProps) {
  const t = useTranslations('projects.detail.about');
  const archived = isProjectArchived(project);

  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Local content state so preview reflects saves without page refresh
  const [content, setContent] = useState<JSONContent | null>(
    (project.description as JSONContent | null) ?? null
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<JSONContent | null>(content);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if content overflows the preview max-height after render
  useEffect(() => {
    if (editing) {
      return;
    }

    const el = contentRef.current;

    if (!el) {
      return;
    }

    const raf = requestAnimationFrame(() => {
      setOverflows(el.scrollHeight > PREVIEW_MAX_H);
    });

    return () => cancelAnimationFrame(raf);
  }, [editing, content]);

  const handleDraftChange = useCallback((json: JSONContent) => {
    draftRef.current = json;
  }, []);

  const handleSave = useCallback(async () => {
    const json = draftRef.current;

    if (!json) {
      return;
    }

    setSaveStatus('saving');

    const result = await updateProjectDescription({
      projectId: project.id,
      description: json,
    });

    if (result.success) {
      setContent(json);
      setSaveStatus('saved');
      setEditing(false);

      if (savedFadeRef.current) {
        clearTimeout(savedFadeRef.current);
      }

      savedFadeRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('failed');
    }
  }, [project.id]);

  const handleCancel = useCallback(() => {
    draftRef.current = content;
    setEditing(false);
    setSaveStatus('idle');
  }, [content]);

  useEffect(() => {
    return () => {
      if (savedFadeRef.current) {
        clearTimeout(savedFadeRef.current);
      }
    };
  }, []);

  const isEmpty = isTiptapEmpty(content);
  const showFade = !editing && !expanded && overflows;

  const header = (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {t('title')}
      </p>

      <div className="flex items-center gap-1.5">
        {editing && (
          <span className="text-muted-foreground text-xs italic">{t('editingMode')}</span>
        )}

        {saveStatus !== 'idle' && !editing && (
          <span
            className={cn(
              'text-xs',
              saveStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {saveStatus === 'saved' && t('saved')}
            {saveStatus === 'failed' && t('failed')}
          </span>
        )}

        {!archived && !editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            aria-label={t('edit')}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );

  if (editing) {
    return (
      <div className="flex min-h-0 min-w-0 flex-col gap-2">
        {header}
        <RichEditor
          content={content}
          onChange={handleDraftChange}
          placeholder={t('placeholder')}
          editable
          autoFocus
          showHint
          className="bg-transparent shadow-none dark:bg-transparent [&_.tiptap]:max-h-[400px] [&_.tiptap]:overflow-y-auto"
        />
        <div className="flex items-center justify-end gap-2 pt-1">
          {saveStatus === 'saving' && (
            <span className="text-muted-foreground text-xs">{t('saving')}</span>
          )}
          {saveStatus === 'failed' && (
            <span className="text-destructive text-xs">{t('failed')}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="size-3.5" />
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveStatus === 'saving'}>
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border/70 relative min-h-0 min-w-0 rounded-lg border border-dashed">
      {/* Header inside the border */}
      <div className="px-4 pt-3">{header}</div>

      {/* Preview content */}
      <div
        ref={contentRef}
        className={cn(
          'overflow-hidden transition-[max-height] duration-300',
          !expanded && 'max-h-[400px]'
        )}
      >
        {isEmpty ? (
          <p className="text-muted-foreground px-4 py-4 text-center text-sm">{t('placeholder')}</p>
        ) : (
          <RichEditor
            content={content}
            editable={false}
            className="border-none bg-transparent shadow-none dark:bg-transparent"
          />
        )}
      </div>

      {/* Fade + show more */}
      {showFade && (
        <>
          <div className="from-background/80 pointer-events-none absolute inset-x-0 bottom-6 h-24 bg-gradient-to-t to-transparent" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-muted-foreground hover:text-foreground relative z-10 w-full pt-1 pb-2 text-center text-xs font-medium transition-colors"
          >
            {t('showMore')}
          </button>
        </>
      )}

      {expanded && overflows && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-muted-foreground hover:text-foreground w-full pt-1 pb-2 text-center text-xs font-medium transition-colors"
        >
          {t('showLess')}
        </button>
      )}
    </div>
  );
}
