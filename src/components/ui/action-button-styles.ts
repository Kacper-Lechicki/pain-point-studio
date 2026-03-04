/**
 * Shared styles for compact status-change action buttons.
 *
 * These are the secondary-tier buttons (archive, delete, restore, complete, etc.)
 * that appear below primary actions in detail panels and headers.
 *
 * The outline Button variant sets `md:hover:text-foreground` which overrides
 * the custom text color on hover. Every color preset here includes explicit
 * hover text-color overrides to prevent that.
 *
 * @example
 * <Button variant="outline" size="sm"
 *   className={cn(COMPACT_ACTION_COLORS.destructive)}
 * >
 */

/** Color presets for compact action buttons. */
export const COMPACT_ACTION_COLORS = {
  /** Red — delete, cancel */
  destructive:
    'text-destructive hover:text-destructive md:hover:text-destructive border-destructive/30 hover:border-destructive/40',

  /** Amber — archive */
  archive:
    'border-amber-500/30 text-amber-700 hover:text-amber-700 md:hover:text-amber-700 hover:border-amber-500/40 dark:text-amber-400 dark:hover:text-amber-400 dark:md:hover:text-amber-400',

  /** Emerald — restore */
  restore:
    'border-emerald-500/30 text-emerald-700 hover:text-emerald-700 md:hover:text-emerald-700 hover:border-emerald-500/40 dark:text-emerald-400 dark:hover:text-emerald-400 dark:md:hover:text-emerald-400',

  /** Violet — complete */
  complete:
    'border-violet-500/30 text-violet-600 hover:text-violet-600 md:hover:text-violet-600 hover:border-violet-500/40 dark:text-violet-400 dark:hover:text-violet-400 dark:md:hover:text-violet-400',
} as const;
