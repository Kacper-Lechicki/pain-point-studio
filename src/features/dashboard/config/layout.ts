/** Path prefix for survey builder (edit questions). Builder uses a standalone full-screen layout. */
export const BUILDER_PATH_PREFIX = '/dashboard/surveys/new/';

export function isBuilderPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith(BUILDER_PATH_PREFIX) === true &&
    pathname.length > BUILDER_PATH_PREFIX.length
  );
}

// ── Sidebar / panel widths ──────────────────────────────────────────
// Single source of truth. Actual pixel values live in CSS vars (globals.css):
//   --sidebar-width-collapsed: 48px
//   --sidebar-width-expanded:  224px
//   --sidebar-sub-panel-width: 224px

/** Tailwind class for sidebar sub-panel width. */
export const SIDEBAR_SUB_PANEL_WIDTH_CLASS = 'w-[var(--sidebar-sub-panel-width)]';

/** Builder side-panels share the same width for visual symmetry. */
export const BUILDER_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

/** Right-hand settings panel in builder is wider for editing comfort. */
export const BUILDER_SETTINGS_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

// ── Content area ────────────────────────────────────────────────────

export const DASHBOARD_CONTENT_PADDING = 'px-4 pt-6 pb-20 sm:px-6 md:pb-8 lg:px-8';
export const DASHBOARD_CONTENT_MAX_WIDTH = 'max-w-4xl';
export const DASHBOARD_PAGE_BODY_GAP = 'mb-8';
export const DASHBOARD_PAGE_BODY_GAP_TOP = 'mt-8';
