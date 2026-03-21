'use client';

import { useState } from 'react';

import { ArrowRightLeft, GripVertical, Info, X } from 'lucide-react';
import { Sparkles } from 'lucide-react';
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
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import type { InsightSuggestion, InsightType } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface SuggestionCardProps {
  suggestion: InsightSuggestion;
  onMoveTo: (signature: string, type: InsightType, content: string) => void;
  onDismissed: (signature: string) => void;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
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
  const [infoOpen, setInfoOpen] = useState(false);

  const handleMoveTo = (type: InsightType) => {
    onMoveTo(suggestion.signature, type, suggestion.content);
  };

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

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-foreground text-[13px] leading-relaxed">{suggestion.content}</span>
          <div className="text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3" aria-hidden />
            <span className="text-[11px]">{suggestion.source.surveyTitle}</span>
          </div>
        </div>

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
              <p className="text-foreground text-sm">{suggestion.content}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
