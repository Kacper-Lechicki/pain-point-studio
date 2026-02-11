/**
 * Shared active/inactive styling for navigation items.
 *
 * Uses `data-[state=active|inactive]` attribute pattern.
 * Two variants: sidebar region (sidebar-* tokens) and content region (standard tokens).
 */

/** For sidebar region: nav panel + sub-panel */
export const SIDEBAR_NAV_ITEM_CLASSES =
  'flex min-h-10 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 ' +
  'text-sidebar-foreground/70 ' +
  'data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-foreground data-[state=active]:border-sidebar-primary data-[state=active]:border-solid ' +
  'data-[state=inactive]:md:hover:text-sidebar-foreground data-[state=inactive]:md:hover:border-sidebar-foreground/25 data-[state=inactive]:md:hover:border-dashed';

/** For content region: settings nav */
export const CONTENT_NAV_ITEM_CLASSES =
  'flex min-h-10 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 ' +
  'text-muted-foreground ' +
  'data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:border-solid ' +
  'data-[state=inactive]:md:hover:text-foreground data-[state=inactive]:md:hover:border-muted-foreground/30 data-[state=inactive]:md:hover:border-dashed';
