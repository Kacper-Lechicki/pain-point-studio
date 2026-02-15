'use client';

import { useRef } from 'react';

import { GripVertical, MoreVertical, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QUESTION_TYPE_ICONS } from '@/features/surveys/config';
import type { QuestionSchema } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

interface BuilderSidebarItemProps {
  question: QuestionSchema;
  index: number;
  isActive: boolean;
  isDragging?: boolean;
  dragHandleProps?: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  onSelect: () => void;
  onDelete: () => void;
}

export function BuilderSidebarItem({
  question,
  index,
  isActive,
  isDragging = false,
  dragHandleProps,
  onSelect,
  onDelete,
}: BuilderSidebarItemProps) {
  const t = useTranslations();
  const TypeIcon = QUESTION_TYPE_ICONS[question.type];
  const displayText = question.text.trim() || t('surveys.builder.untitledQuestion');
  const menuOpenRef = useRef(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!menuOpenRef.current) {
          onSelect();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();

          if (!menuOpenRef.current) {
            onSelect();
          }
        }
      }}
      className={cn(
        'group flex min-h-10 cursor-pointer items-center gap-2 border-l-2 pr-2 pl-4 text-sm transition-colors md:min-h-9',
        isActive ? 'border-primary bg-accent/50' : 'hover:bg-accent/30 border-transparent',
        isDragging && 'opacity-50'
      )}
    >
      {dragHandleProps ? (
        <span
          className="text-muted-foreground flex shrink-0 cursor-grab touch-none active:cursor-grabbing [.group:active_&]:cursor-grabbing"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            dragHandleProps.onPointerDown(e);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          aria-label={t('surveys.builder.dragToReorder')}
          role="button"
          tabIndex={-1}
        >
          <GripVertical className="size-4" aria-hidden />
        </span>
      ) : null}
      {/* Number */}
      <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
        {index + 1}.
      </span>

      {/* Type icon */}
      <TypeIcon className="text-muted-foreground size-4 shrink-0" />

      {/* Text */}
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs',
          question.text.trim() ? 'text-foreground' : 'text-muted-foreground italic'
        )}
      >
        {displayText}
      </span>

      {/* Action menu */}
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) {
            menuOpenRef.current = true;
          } else {
            // Delay reset so the parent onClick doesn't fire on close
            setTimeout(() => {
              menuOpenRef.current = false;
            }, 100);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('surveys.builder.questionActions')}
          >
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            {t('surveys.builder.deleteQuestion')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
