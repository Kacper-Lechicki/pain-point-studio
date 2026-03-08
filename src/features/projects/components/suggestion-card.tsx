'use client';

import { useRef, useState } from 'react';

import { ArrowRightLeft, GripVertical, Info, Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import type { InsightSuggestion, InsightType } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface SuggestionCardProps {
  suggestion: InsightSuggestion;
  onMoveTo: (signature: string, type: InsightType, content: string) => void;
  onDismissed: (signature: string) => void;
  /** Called when pointer goes down on the drag handle. */
  onDragStart?: (e: React.PointerEvent) => void;
  /** Whether this card is currently being dragged. */
  isDragging?: boolean;
  /** Hide the drag handle (e.g. on mobile). */
  hideDragHandle?: boolean;
}

export function SuggestionCard({
  suggestion,
  onMoveTo,
  onDismissed,
  onDragStart,
  isDragging,
  hideDragHandle,
}: SuggestionCardProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(suggestion.content);
  /** Ephemeral content after "Save" without moving — used for display and for next move. */
  const [localContent, setLocalContent] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayContent = localContent ?? suggestion.content;

  const handleStartEdit = () => {
    setEditContent(displayContent);
    setIsEditing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(displayContent);
  };

  const handleMoveTo = (type: InsightType) => {
    const content = (isEditing ? editContent.trim() : displayContent) || suggestion.content;
    setIsEditing(false);
    onMoveTo(suggestion.signature, type, content);
  };

  // ── Edit mode ────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="bg-card flex flex-col gap-2 rounded-lg border p-2">
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          maxLength={INSIGHT_CONTENT_MAX_LENGTH}
          size="sm"
          placeholder={t('projects.suggestions.editPlaceholder' as MessageKey)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCancelEdit();
            }
          }}
        />

        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim()}>
            {t('common.actions.save')}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  // ── Save local edit (no server call — just updates local text) ────

  function handleSaveEdit() {
    const trimmed = editContent.trim();

    if (!trimmed || trimmed === suggestion.content) {
      setIsEditing(false);

      return;
    }

    // Store locally for display & future move; only persists if user then moves to a column.
    setLocalContent(trimmed);
    setIsEditing(false);
  }

  // ── Default mode ─────────────────────────────────────────────────

  return (
    <>
      <div
        className={cn(
          'bg-card group relative flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-sm transition-shadow md:hover:shadow-md',
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
          {displayContent}
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
            <DropdownMenuItem onClick={() => setInfoOpen(true)}>
              <Info className="size-3.5" />
              {t('projects.suggestions.info' as MessageKey)}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleStartEdit}>
              <Pencil className="size-3.5" />
              {t('common.actions.edit')}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRightLeft className="size-3.5" />
                {t('projects.insights.moveTo' as MessageKey)}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {INSIGHT_TYPES.map((type) => {
                  const Icon = INSIGHT_ICONS[type];
                  const typeColors = INSIGHT_COLORS[type];

                  return (
                    <DropdownMenuItem key={type} onClick={() => handleMoveTo(type)}>
                      <Icon className={cn('size-3.5', typeColors.icon)} />
                      {t(`projects.insights.types.${type}` as MessageKey)}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDismissed(suggestion.signature)}
            >
              <X className="size-3.5" />
              {t('projects.suggestions.dismiss' as MessageKey)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('projects.suggestions.infoTitle' as MessageKey)}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('projects.suggestions.infoTitle' as MessageKey)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t('projects.suggestions.infoSurvey' as MessageKey)}
              </span>
              <p className="text-foreground text-sm">{suggestion.source.surveyTitle}</p>
            </div>

            {suggestion.source.questionText && (
              <div>
                <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {t('projects.suggestions.infoQuestion' as MessageKey)}
                </span>
                <p className="text-foreground text-sm">{suggestion.source.questionText}</p>
              </div>
            )}

            <div>
              <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t('projects.suggestions.infoContent' as MessageKey)}
              </span>
              <p className="text-foreground text-sm">{displayContent}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
