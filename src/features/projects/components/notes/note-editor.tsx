'use client';

import { useCallback } from 'react';

import type { JSONContent } from '@tiptap/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { StickyNote } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RichEditor } from '@/components/shared/rich-editor/rich-editor';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { SaveStatus } from '@/features/projects/hooks/use-note-auto-save';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { cn } from '@/lib/common/utils';

interface NoteEditorProps {
  noteId: string | null;
  content: JSONContent | null;
  isLoading: boolean;
  saveStatus: SaveStatus;
  editable: boolean;
  onContentChange: (json: JSONContent) => void;
  onBack?: () => void;
}

export function NoteEditor({
  noteId,
  content,
  isLoading,
  saveStatus,
  editable,
  onContentChange,
  onBack,
}: NoteEditorProps) {
  const t = useTranslations('projects.detail.notes');
  const isDesktop = useBreakpoint('md');

  const handleChange = useCallback(
    (json: JSONContent) => {
      onContentChange(json);
    },
    [onContentChange]
  );

  // No note selected
  if (!noteId) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <EmptyState
          icon={StickyNote}
          title={t('selectNote')}
          description={t('selectNoteDescription')}
          variant="compact"
        />
      </div>
    );
  }

  // Loading content
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Mobile back button */}
      {!isDesktop && onBack && (
        <div className="absolute top-2 left-0 z-10">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">{t('back')}</span>
          </Button>
        </div>
      )}

      {/* Save status — always visible, floating top-right */}
      {editable && noteId && (
        <div className="pointer-events-none absolute top-2.5 right-3 z-10">
          <span
            className={cn(
              'text-xs transition-colors',
              saveStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {(saveStatus === 'idle' || saveStatus === 'saved') && t('saved')}
            {saveStatus === 'pending' && t('notSaved')}
            {saveStatus === 'saving' && t('saving')}
            {saveStatus === 'failed' && t('failed')}
          </span>
        </div>
      )}

      {/* Editor — fills entire surface */}
      <div className="flex-1 overflow-y-auto">
        <RichEditor
          content={content}
          onChange={handleChange}
          placeholder={t('placeholder')}
          editable={editable}
          showHint={editable}
          className="note-editor border-0 shadow-none ring-0 focus-within:ring-0"
        />
      </div>
    </div>
  );
}
