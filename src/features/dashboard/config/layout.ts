import { ROUTES } from '@/config/routes';
import { locales } from '@/i18n/constants';

/** Path prefix for survey builder (edit questions). Builder uses a standalone full-screen layout. */
const BUILDER_PATH_PREFIX = '/dashboard/research/new/';

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

/** Width of the sub-panel toggle strip when closed (~2/3 of collapsed main sidebar). */
export const SUBPANEL_TOGGLE_STRIP_WIDTH = 25;

/** Left offset for main content and page footer (so they start where sidebars end). */
export function getDashboardContentMarginLeft(
  isPinned: boolean,
  subPanelVisible: boolean,
  hasSubPanelClosed: boolean
): string {
  if (subPanelVisible) {
    return isPinned
      ? 'calc(var(--sidebar-width-expanded) + var(--sidebar-sub-panel-width))'
      : 'calc(var(--sidebar-width-collapsed) + var(--sidebar-sub-panel-width))';
  }

  if (hasSubPanelClosed) {
    return isPinned
      ? `calc(var(--sidebar-width-expanded) + ${SUBPANEL_TOGGLE_STRIP_WIDTH}px)`
      : `calc(var(--sidebar-width-collapsed) + ${SUBPANEL_TOGGLE_STRIP_WIDTH}px)`;
  }

  return isPinned ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)';
}

// ── Footer (page + sidebar) ──────────────────────────────────────────

/** Height shared by dashboard page footer and sidebar footer (lock). */
export const DASHBOARD_FOOTER_HEIGHT_CLASS = 'h-12';

/** Vertical gap between main content and dashboard footer. */
export const DASHBOARD_FOOTER_GAP_TOP_CLASS = 'mt-10';

// ── Content area ────────────────────────────────────────────────────

export const DASHBOARD_CONTENT_MAX_WIDTH = 'container';

/** Number of items visible in dashboard bento cards (projects list, recent activity). */
export const BENTO_VISIBLE_ITEMS = 5;

type DashboardContentWidth = 'narrow' | 'content' | 'full';

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

  if (path === ROUTES.profile.preview) {
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
