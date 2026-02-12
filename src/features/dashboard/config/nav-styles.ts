/**
 * Shared active/inactive styling for navigation items.
 *
 * Two approaches:
 * 1. `data-[state=active|inactive]` attribute — for components where SSR and
 *    client agree on active state (sidebar-item, mobile-nav).
 * 2. `SIDEBAR_NAV_ITEM_*` split classes — for components where `useSearchParams()`
 *    causes SSR/client mismatch (secondary-nav). Use with `cn()`.
 *
 * Two variants: sidebar region (sidebar-* tokens) and content region (standard tokens).
 */

// ── Base classes (shared by both approaches) ─────────────────────────
const SIDEBAR_NAV_ITEM_BASE =
  'flex min-h-10 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 text-sidebar-foreground/70';

const CONTENT_NAV_ITEM_BASE =
  'flex min-h-10 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 text-muted-foreground';

// ── Active / Inactive class sets (for cn()-based usage) ──────────────

/** Sidebar region – active state classes */
export const SIDEBAR_NAV_ACTIVE =
  'bg-sidebar-accent text-sidebar-foreground border-sidebar-primary border-solid';

/** Sidebar region – inactive state classes */
export const SIDEBAR_NAV_INACTIVE =
  'md:hover:text-sidebar-foreground md:hover:border-sidebar-foreground/25 md:hover:border-dashed';

/** Content region – active state classes */
export const CONTENT_NAV_ACTIVE = 'bg-accent text-foreground border-primary border-solid';

/** Content region – inactive state classes */
export const CONTENT_NAV_INACTIVE =
  'md:hover:text-foreground md:hover:border-muted-foreground/30 md:hover:border-dashed';

// ── Exported base classes (for cn()-based usage) ─────────────────────
export { SIDEBAR_NAV_ITEM_BASE, CONTENT_NAV_ITEM_BASE };

// ── data-[state] variants (for attribute-driven usage) ───────────────

/** For sidebar region: nav panel + sub-panel (attribute-driven) */
export const SIDEBAR_NAV_ITEM_CLASSES =
  SIDEBAR_NAV_ITEM_BASE +
  ' data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-foreground data-[state=active]:border-sidebar-primary data-[state=active]:border-solid' +
  ' data-[state=inactive]:md:hover:text-sidebar-foreground data-[state=inactive]:md:hover:border-sidebar-foreground/25 data-[state=inactive]:md:hover:border-dashed';

/** For content region: settings nav (attribute-driven) */
export const CONTENT_NAV_ITEM_CLASSES =
  CONTENT_NAV_ITEM_BASE +
  ' data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:border-solid' +
  ' data-[state=inactive]:md:hover:text-foreground data-[state=inactive]:md:hover:border-muted-foreground/30 data-[state=inactive]:md:hover:border-dashed';
