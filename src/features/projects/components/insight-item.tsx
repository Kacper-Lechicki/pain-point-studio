'use client';

import { useCallback, useRef, useState } from 'react';

import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Textarea } from '@/components/ui/textarea';
import { deleteInsight } from '@/features/projects/actions/delete-insight';
import { updateInsight } from '@/features/projects/actions/update-insight';
import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface InsightItemProps {
  insight: ProjectInsight;
  onUpdated: (insight: ProjectInsight) => void;
  onDeleted: (insightId: string) => void;
}

export function InsightItem({ insight, onUpdated, onDeleted }: InsightItemProps) {
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

  const type = insight.type as InsightType;
  const Icon = INSIGHT_ICONS[type];
  const colors = INSIGHT_COLORS[type];

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
      <div className={cn('flex flex-col gap-2 rounded-md px-3 py-2', colors.bg)}>
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          maxLength={INSIGHT_CONTENT_MAX_LENGTH}
          size="sm"
          className="bg-background"
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
      <div className={cn('group flex items-start gap-2 rounded-md px-3 py-2', colors.bg)}>
        <Icon className={cn('mt-0.5 size-3.5 shrink-0', colors.icon)} aria-hidden />

        <span className={cn('flex-1 text-xs leading-relaxed', colors.text)}>{insight.content}</span>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={handleStartEdit}
            aria-label={t('projects.scorecard.editNote' as MessageKey)}
          >
            <Pencil className="size-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label={t('projects.scorecard.deleteNote' as MessageKey)}
          >
            <Trash2 className="size-3" />
          </Button>

          <Badge
            variant="outline"
            className="mt-0.5 border-current/20 px-1.5 py-0 text-[10px] font-normal opacity-60"
          >
            {t('projects.scorecard.noteBadge' as MessageKey)}
          </Badge>
        </div>
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
