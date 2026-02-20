/**
 * Shared active/inactive styling for navigation items.
 *
 * Two approaches:
 * 1. `data-[state=active|inactive]` attribute — for components where SSR and
 *    client agree on active state (sidebar-item, mobile-nav).
 * 2. `SIDEBAR_NAV_ITEM_*` split classes — for components where `useSearchParams()`
 *    causes SSR/client mismatch (secondary-nav). Use with `cn()`.
 */

// ── Base class (shared by both approaches) ───────────────────────────
export const SIDEBAR_NAV_ITEM_BASE =
  'flex min-h-8 w-full items-center justify-start gap-2 rounded-lg border border-transparent px-2.5 text-sm font-medium transition-colors text-sidebar-foreground/70';

// ── Active / Inactive class sets (for cn()-based usage) ──────────────

/** Sidebar region – active state classes */
export const SIDEBAR_NAV_ACTIVE = 'bg-sidebar-primary-active text-sidebar-primary-foreground';

/** Sidebar region – inactive state classes */
export const SIDEBAR_NAV_INACTIVE =
  'md:hover:text-sidebar-foreground md:hover:border-sidebar-foreground/25 md:hover:border-dashed';

// ── data-[state] variant (for attribute-driven usage) ────────────────

/** For sidebar region: nav panel + sub-panel (attribute-driven) */
export const SIDEBAR_NAV_ITEM_CLASSES =
  SIDEBAR_NAV_ITEM_BASE +
  ' data-[state=active]:bg-sidebar-primary-active data-[state=active]:text-sidebar-primary-foreground' +
  ' data-[state=inactive]:md:hover:text-sidebar-foreground data-[state=inactive]:md:hover:border-sidebar-foreground/25 data-[state=inactive]:md:hover:border-dashed';
