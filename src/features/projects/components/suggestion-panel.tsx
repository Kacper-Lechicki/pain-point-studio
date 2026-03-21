'use client';

import { Lightbulb, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InsightColumnInfo } from '@/features/projects/components/insight-column-info';
import { SuggestionCard } from '@/features/projects/components/suggestion-card';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { InsightSuggestion, InsightType } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface SuggestionColumnProps {
  suggestions: InsightSuggestion[];
  totalCompletedResponses: number;
  onMoveTo: (signature: string, type: InsightType, content: string) => void;
  onDismissed: (signature: string) => void;
  /** Whether a card from another column is hovering over this column. */
  isDropTarget?: boolean;
  /** Whether any drag is happening on the board. */
  isDragActive?: boolean;
  /** Called when pointer goes down on a card's drag handle. */
  onDragStart?: (e: React.PointerEvent, signature: string) => void;
  /** Returns true if this suggestion is currently being dragged. */
  isDragging?: (signature: string) => boolean;
  /** Whether to show drop placeholder at this index. */
  showPlaceholderAt?: (index: number) => boolean;
  /** Whether to show a placeholder after the last card. */
  showPlaceholderAtEnd?: boolean;
  /** Optional custom card renderer (e.g. for mobile cards). */
  renderCard?: (suggestion: InsightSuggestion) => React.ReactNode;
  hasCompletedSurveys?: boolean | undefined;
}

/** Drop placeholder shown between cards during drag. */
function DropPlaceholder() {
  return (
    <div className="border-primary/50 bg-primary/5 mb-2 min-h-10 rounded-lg border border-dashed md:min-h-9" />
  );
}

export function SuggestionColumn({
  suggestions,
  totalCompletedResponses,
  onMoveTo,
  onDismissed,
  isDropTarget,
  isDragActive,
  onDragStart,
  isDragging,
  showPlaceholderAt,
  showPlaceholderAtEnd,
  renderCard,
  hasCompletedSurveys,
}: SuggestionColumnProps) {
  const t = useTranslations();

  const notEnoughResponses = totalCompletedResponses < FINDING_THRESHOLDS.minResponses;

  return (
    <div
      data-column-id="suggested"
      className={cn(
        'bg-muted dark:bg-muted flex min-w-0 flex-col gap-2.5 rounded-xl p-3 transition-colors',
        isDropTarget && 'bg-primary/5 ring-primary/20 ring-1',
        isDragActive && !isDropTarget && 'cursor-not-allowed'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-muted-foreground size-3.5" aria-hidden />
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {t('projects.suggestions.title' as MessageKey)}
          </span>
          <span className="text-muted-foreground text-[11px]">{suggestions.length}</span>
          <InsightColumnInfo columnKey="suggested" />
        </div>
      </div>

      {/* Min responses banner — encouragement, not a blocker */}
      {notEnoughResponses && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            {t('projects.suggestions.minResponsesBanner' as MessageKey, {
              min: FINDING_THRESHOLDS.minResponses,
            })}
          </p>
        </div>
      )}

      {/* Card list */}
      {suggestions.length > 0 || isDragActive ? (
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.signature}>
              {showPlaceholderAt?.(index) && <DropPlaceholder />}
              <div data-insight-id={suggestion.signature}>
                {renderCard ? (
                  renderCard(suggestion)
                ) : (
                  <SuggestionCard
                    suggestion={suggestion}
                    onMoveTo={onMoveTo}
                    onDismissed={onDismissed}
                    isDragging={isDragging?.(suggestion.signature) ?? false}
                    {...(onDragStart && {
                      onDragStart: (e: React.PointerEvent) => onDragStart(e, suggestion.signature),
                    })}
                  />
                )}
              </div>
            </div>
          ))}
          {showPlaceholderAtEnd && <DropPlaceholder />}
        </div>
      ) : (
        !notEnoughResponses && (
          <div className="border-border/70 dark:border-border/80 flex items-center justify-center rounded-lg border border-dashed py-10">
            <span className="text-muted-foreground max-w-[200px] text-center text-xs">
              {t(
                hasCompletedSurveys
                  ? ('projects.suggestions.allReviewed' as MessageKey)
                  : ('projects.suggestions.empty' as MessageKey)
              )}
            </span>
          </div>
        )
      )}
    </div>
  );
}
