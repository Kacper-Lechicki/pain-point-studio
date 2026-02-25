'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Search, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { Finding, InsightType } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Message key mapping ───────────────────────────────────────────────

function getMessageKey(finding: Finding): MessageKey {
  switch (finding.source) {
    case 'yes_no':
      return finding.value >= FINDING_THRESHOLDS.yesNo.highMin
        ? ('projects.findings.yesNoHigh' as MessageKey)
        : ('projects.findings.yesNoLow' as MessageKey);
    case 'rating':
      return finding.value >= FINDING_THRESHOLDS.rating.highMin
        ? ('projects.findings.ratingHigh' as MessageKey)
        : ('projects.findings.ratingLow' as MessageKey);
    case 'multiple_choice':
      return 'projects.findings.mcDominant' as MessageKey;
    case 'completion_rate':
      return 'projects.findings.completionLow' as MessageKey;
  }
}

function getMessageParams(finding: Finding): Record<string, string | number> {
  const pct = Math.round(finding.value * 100);

  switch (finding.source) {
    case 'yes_no':
      return { pct, question: finding.questionText ?? '' };
    case 'rating':
      return {
        avg: Number(finding.value.toFixed(1)),
        max: finding.detail ?? '5',
        question: finding.questionText ?? '',
      };
    case 'multiple_choice':
      return { pct, option: finding.detail ?? '', question: finding.questionText ?? '' };
    case 'completion_rate':
      return { pct, survey: finding.surveyTitle ?? '' };
  }
}

/** Build a unique string id for a finding (used as DnD draggable id). */
export function getFindingId(finding: Finding, index: number): string {
  return `finding-${finding.source}-${index}`;
}

/** Build the translated text content for a finding. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFindingText(finding: Finding, t: any): string {
  const messageKey = getMessageKey(finding);
  const messageParams = getMessageParams(finding);

  return t(messageKey, messageParams) as string;
}

// ── Component ─────────────────────────────────────────────────────────

interface FindingCardProps {
  finding: Finding;
  index: number;
  onCategorize?: (insightType: InsightType) => void;
}

export function FindingCard({ finding, index, onCategorize }: FindingCardProps) {
  const t = useTranslations();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: getFindingId(finding, index),
    data: { finding, index },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const messageKey = getMessageKey(finding);
  const messageParams = getMessageParams(finding);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-muted/50 dark:bg-muted/30 flex items-start gap-2 rounded-md px-3 py-2',
        isDragging && 'ring-primary/30 opacity-50 shadow-lg ring-2'
      )}
    >
      {/* Drag handle — hidden on mobile */}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground mt-0.5 hidden shrink-0 cursor-grab touch-none active:cursor-grabbing md:block"
        {...listeners}
        {...attributes}
        aria-label="Drag to categorize"
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Icon */}
      <Search className="text-muted-foreground mt-0.5 size-3.5 shrink-0 md:hidden" aria-hidden />

      <span className="text-foreground flex-1 text-xs leading-relaxed">
        {t(messageKey, messageParams as Record<string, never>)}
      </span>

      <Badge
        variant="outline"
        className="mt-0.5 shrink-0 border-current/20 px-1.5 py-0 text-[10px] font-normal opacity-60"
      >
        {t('projects.findings.badge' as MessageKey)}
      </Badge>

      {/* Mobile: categorize button */}
      {onCategorize && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 md:hidden"
              aria-label={t('projects.findings.categorize' as MessageKey)}
            >
              <Tag className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {INSIGHT_TYPES.map((insightType) => {
              const Icon = INSIGHT_ICONS[insightType];
              const colors = INSIGHT_COLORS[insightType];

              return (
                <DropdownMenuItem
                  key={insightType}
                  onClick={() => onCategorize(insightType)}
                  className="gap-2"
                >
                  <Icon className={cn('size-3.5', colors.icon)} aria-hidden />
                  {t(`projects.insightTypes.${insightType}` as MessageKey)}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
