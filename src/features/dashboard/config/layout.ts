import { ROUTES } from '@/config/routes';
import { locales } from '@/i18n/constants';

/** Path prefix for survey builder (edit questions). Builder uses a standalone full-screen layout. */
export const BUILDER_PATH_PREFIX = '/dashboard/research/new/';

/** Check if the pathname points to the survey builder (creating/editing questions). */
export function isBuilderPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith(BUILDER_PATH_PREFIX) === true &&
    pathname.length > BUILDER_PATH_PREFIX.length
  );
}

// ── Sidebar / panel widths ──────────────────────────────────────────
// Single source of truth. Actual pixel values live in CSS vars (globals.css):
//   --sidebar-width-collapsed: 40px
//   --sidebar-width-expanded:  236px
//   --sidebar-sub-panel-width: 236px

/** Left offset for main content and page footer (so they start where sidebars end). */
export function getDashboardContentMarginLeft(isPinned: boolean, hasSubPanel: boolean): string {
  if (hasSubPanel) {
    return isPinned
      ? 'calc(var(--sidebar-width-expanded) + var(--sidebar-sub-panel-width))'
      : 'calc(var(--sidebar-width-collapsed) + var(--sidebar-sub-panel-width))';
  }

  return isPinned ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)';
}

/** Builder side-panels share the same fixed width for visual symmetry. */
export const BUILDER_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

// ── Footer (page + sidebar) ──────────────────────────────────────────

/** Height shared by dashboard page footer and sidebar footer (lock). */
export const DASHBOARD_FOOTER_HEIGHT_CLASS = 'h-12';

/** Vertical gap between main content and dashboard footer. */
export const DASHBOARD_FOOTER_GAP_TOP_CLASS = 'mt-10';

// ── Content area ────────────────────────────────────────────────────

export const DASHBOARD_CONTENT_MAX_WIDTH = 'container';
export const DASHBOARD_PAGE_BODY_GAP = 'mb-8';
export const DASHBOARD_PAGE_BODY_GAP_TOP = 'mt-8';

export type DashboardContentWidth = 'narrow' | 'content' | 'full';

/** Strip the leading locale segment (e.g. '/en/dashboard' → '/dashboard'). No-op if absent. */
function pathWithoutLocale(pathname: string): string {
  const segment = pathname.split('/')[1];

  if (segment && (locales as readonly string[]).includes(segment)) {
    return '/' + pathname.split('/').slice(2).join('/') || '/';
  }

  return pathname;
}

/** Routes rendered at narrow content width (settings, new project form). */
function isNarrowPath(pathname: string): boolean {
  const path = pathWithoutLocale(pathname);

  if (path === ROUTES.common.settings || path.startsWith(ROUTES.common.settings + '/')) {
    return true;
  }

  if (path === ROUTES.dashboard.projectNew) {
    return true;
  }

  if (path.endsWith('/new-survey')) {
    return true;
  }

  return false;
}

/**
 * Content width per route: narrow (forms/settings), content (all other pages).
 * All non-narrow pages share the same max-width for consistent layout.
 */
export function getDashboardContentMaxWidth(pathname: string | null): DashboardContentWidth {
  if (!pathname) {
    return 'content';
  }

  if (isNarrowPath(pathname)) {
    return 'narrow';
  }

  return 'content';
}
