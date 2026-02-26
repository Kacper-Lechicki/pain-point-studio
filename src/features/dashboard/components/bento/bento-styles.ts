/**
 * Shared class names for the dashboard bento layout.
 * Keeps cards visually consistent with the reference: rounded, subtle border, clean spacing.
 */
export const BENTO_CARD_CLASS = 'rounded-2xl border border-border/50 bg-card shadow-sm gap-0 py-0';

/** Min height for Row 4 cards (Pinned Project + Your Projects) so they stay equal and fit 5 list items. */
export const BENTO_ROW4_CARD_MIN_H = 'min-h-[14rem]';

/** Min height for empty state content so middle row and pinned empty stay aligned. */
export const BENTO_EMPTY_STATE_MIN_H = 'min-h-52';

/** Min height for chart cards in row 3 so both columns are equal on desktop (2-col grid). */
export const BENTO_CHART_CARD_MIN_H = 'min-h-72';
