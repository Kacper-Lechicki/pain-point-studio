'use client';

import { useCallback, useRef, useState } from 'react';

import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { deleteInsight } from '@/features/projects/actions/delete-insight';
import { updateInsight } from '@/features/projects/actions/update-insight';
import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import type { ProjectInsight } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface KanbanCardProps {
  insight: ProjectInsight;
  onUpdated: (insight: ProjectInsight) => void;
  onDeleted: (insightId: string) => void;
}

export function KanbanCard({ insight, onUpdated, onDeleted }: KanbanCardProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(insight.content);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const deleteAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleStartEdit = useCallback(() => {
    setEditContent(insight.content);
    setIsEditing(true);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [insight.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(insight.content);
  }, [insight.content]);

  const handleSaveEdit = useCallback(async () => {
    const trimmed = editContent.trim();

    if (!trimmed || trimmed === insight.content) {
      setIsEditing(false);

      return;
    }

    const original = insight;

    onUpdated({ ...insight, content: trimmed, updated_at: new Date().toISOString() });
    setIsEditing(false);

    const result = await updateAction.execute(updateInsight, {
      insightId: insight.id,
      content: trimmed,
    });

    if (result && !result.error) {
      toast.success(t('projects.scorecard.updateSuccess' as MessageKey));
    } else {
      onUpdated(original);
    }
  }, [editContent, insight, onUpdated, updateAction, t]);

  const handleConfirmDelete = useCallback(async () => {
    const original = insight;

    setConfirmDeleteOpen(false);
    onDeleted(insight.id);

    const result = await deleteAction.execute(deleteInsight, {
      insightId: insight.id,
    });

    if (result && !result.error) {
      toast.success(t('projects.scorecard.deleteSuccess' as MessageKey));
    } else {
      onUpdated(original);
    }
  }, [insight, onDeleted, onUpdated, deleteAction, t]);

  if (isEditing) {
    return (
      <div className="bg-card flex flex-col gap-2 rounded border p-2">
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          maxLength={INSIGHT_CONTENT_MAX_LENGTH}
          size="sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              void handleSaveEdit();
            }

            if (e.key === 'Escape') {
              handleCancelEdit();
            }
          }}
        />

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={updateAction.isLoading || !editContent.trim()}
          >
            {t('projects.scorecard.saveNote' as MessageKey)}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            {t('projects.scorecard.cancelNote' as MessageKey)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card group flex items-center gap-2 rounded border px-2.5 py-2">
        <GripVertical className="text-muted-foreground size-3 shrink-0" aria-hidden />

        <span className="text-foreground min-w-0 flex-1 text-[13px] leading-snug">
          {insight.content}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <span className="sr-only">Actions</span>
              <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleStartEdit}>
              <Pencil className="size-3.5" />
              {t('projects.scorecard.editNote' as MessageKey)}
            </DropdownMenuItem>

            <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="size-3.5" />
              {t('projects.scorecard.deleteNote' as MessageKey)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title={t('projects.scorecard.confirmDeleteTitle' as MessageKey)}
        description={t('projects.scorecard.confirmDeleteDescription' as MessageKey)}
        confirmLabel={t('projects.scorecard.confirmDeleteAction' as MessageKey)}
        variant="destructive"
      />
    </>
  );
}
