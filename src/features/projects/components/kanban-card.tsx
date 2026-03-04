'use client';

import { useCallback, useRef, useState } from 'react';

import { ArrowRightLeft, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { deleteInsight } from '@/features/projects/actions/delete-insight';
import { updateInsight } from '@/features/projects/actions/update-insight';
import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface KanbanCardProps {
  insight: ProjectInsight;
  onUpdated: (insight: ProjectInsight) => void;
  onDeleted: (insightId: string) => void;
  /** Called when pointer goes down on the drag handle. */
  onDragStart?: (e: React.PointerEvent) => void;
  /** Whether this card is currently being dragged. */
  isDragging?: boolean;
  /** Hide the drag handle (e.g. on mobile). */
  hideDragHandle?: boolean;
  /** Show a colored left border stripe for the insight type. */
  showStripe?: boolean;
  /** Called when user requests moving the insight to a different type via submenu. */
  onMoveToType?: (insightId: string, newType: InsightType) => void;
}

export function KanbanCard({
  insight,
  onUpdated,
  onDeleted,
  onDragStart,
  isDragging,
  hideDragHandle,
  showStripe,
  onMoveToType,
}: KanbanCardProps) {
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

  const colors = INSIGHT_COLORS[insight.type as InsightType];

  if (isEditing) {
    return (
      <div className="bg-card flex flex-col gap-2 rounded-lg border p-2">
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
            {t('common.actions.save')}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'bg-card group relative flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md',
          showStripe && 'border-l-2',
          showStripe && colors?.stripe,
          isDragging && 'invisible h-0 min-h-0 overflow-hidden border-none p-0'
        )}
      >
        {!hideDragHandle && (
          <GripVertical
            className="text-muted-foreground mt-0.5 size-3 shrink-0 cursor-grab touch-none active:cursor-grabbing"
            aria-hidden
            onPointerDown={(e) => {
              if (onDragStart) {
                e.stopPropagation();
                e.preventDefault();
                onDragStart(e);
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
              }
            }}
          />
        )}

        <span className="text-foreground min-w-0 flex-1 text-[13px] leading-relaxed">
          {insight.content}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground mt-0.5 shrink-0"
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
              {t('common.actions.edit')}
            </DropdownMenuItem>

            {onMoveToType && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRightLeft className="size-3.5" />
                    {t('projects.insights.moveTo' as MessageKey)}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {INSIGHT_TYPES.filter((type) => type !== insight.type).map((type) => {
                      const Icon = INSIGHT_ICONS[type];
                      const typeColors = INSIGHT_COLORS[type];

                      return (
                        <DropdownMenuItem key={type} onClick={() => onMoveToType(insight.id, type)}>
                          <Icon className={cn('size-3.5', typeColors.icon)} />
                          {t(`projects.insights.types.${type}` as MessageKey)}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="size-3.5" />
              {t('common.actions.delete')}
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
        confirmLabel={t('common.actions.delete')}
        variant="destructive"
      />
    </>
  );
}
