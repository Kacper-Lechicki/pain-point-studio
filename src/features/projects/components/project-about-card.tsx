'use client';

import { useEffect, useRef, useState } from 'react';

import type { JSONContent } from '@tiptap/react';
import { Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RichEditor } from '@/components/shared/rich-editor/rich-editor';
import { isTiptapEmpty } from '@/components/shared/rich-editor/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { updateProjectDescription } from '@/features/projects/actions/update-project-description';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

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
  const [dirty, setDirty] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const [content, setContent] = useState<JSONContent | null>(
    (project.description as JSONContent | null) ?? null
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<JSONContent | null>(content);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleDraftChange = (json: JSONContent) => {
    draftRef.current = json;
    setDirty(true);
  };

  const handleSave = async () => {
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
      setDirty(false);

      if (savedFadeRef.current) {
        clearTimeout(savedFadeRef.current);
      }

      savedFadeRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('failed');
    }
  };

  const handleCancelClick = () => {
    if (dirty) {
      setConfirmDiscardOpen(true);
    } else {
      handleDiscard();
    }
  };

  const handleDiscard = () => {
    draftRef.current = content;
    setEditing(false);
    setSaveStatus('idle');
    setDirty(false);
    setConfirmDiscardOpen(false);
  };

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
      <>
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
            <Button variant="ghost" size="sm" onClick={handleCancelClick}>
              <X className="size-3.5" />
              {t('cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {t('saveChanges')}
            </Button>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDiscardOpen}
          onOpenChange={setConfirmDiscardOpen}
          onConfirm={handleDiscard}
          title={t('discardTitle')}
          description={t('discardDescription')}
          confirmLabel={t('discard')}
          variant="destructive"
        />
      </>
    );
  }

  return (
    <div className="border-border/70 relative min-h-0 min-w-0 rounded-lg border border-dashed">
      <div className="px-4 pt-3">{header}</div>

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

      {showFade && (
        <>
          <div className="from-background/80 pointer-events-none absolute inset-x-0 bottom-6 h-24 bg-gradient-to-t to-transparent" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-muted-foreground md:hover:text-foreground relative z-10 w-full pt-1 pb-2 text-center text-xs font-medium transition-colors"
          >
            {t('showMore')}
          </button>
        </>
      )}

      {expanded && overflows && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-muted-foreground md:hover:text-foreground w-full pt-1 pb-2 text-center text-xs font-medium transition-colors"
        >
          {t('showLess')}
        </button>
      )}
    </div>
  );
}
