import type { AppRoute } from '@/config/routes';
import { ROUTES } from '@/config/routes';
import { locales } from '@/i18n/constants';

/** Path prefix for survey builder (edit questions). Builder uses a standalone full-screen layout. */
export const BUILDER_PATH_PREFIX = ROUTES.dashboard.surveysNew + '/';

/** Check if the pathname points to the survey builder (creating/editing questions). */
export function isBuilderPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith(BUILDER_PATH_PREFIX) === true &&
    pathname.length > BUILDER_PATH_PREFIX.length
  );
}

export interface DashboardBackConfig {
  fallbackHref: AppRoute;
}

/**
 * Central config: which dashboard (and related) pages show a back button in the top-left.
 * Back button is rendered at the same vertical height as the first sidebar item.
 */
export function getDashboardBackConfig(pathname: string | null): DashboardBackConfig | null {
  if (!pathname) {
    return null;
  }

  if (pathname.startsWith(ROUTES.dashboard.surveysStats + '/')) {
    return { fallbackHref: ROUTES.dashboard.surveys };
  }

  if (/^\/dashboard\/surveys\/[^/]+$/.test(pathname)) {
    return { fallbackHref: ROUTES.dashboard.surveys };
  }

  if (pathname === ROUTES.profile.preview) {
    return { fallbackHref: ROUTES.settings.profile };
  }

  return null;
}

// ── Sidebar / panel widths ──────────────────────────────────────────
// Single source of truth. Actual pixel values live in CSS vars (globals.css):
//   --sidebar-width-collapsed: 48px
//   --sidebar-width-expanded:  224px
//   --sidebar-sub-panel-width: 224px

/** Tailwind class for sidebar sub-panel width. */
export const SIDEBAR_SUB_PANEL_WIDTH_CLASS = 'w-[var(--sidebar-sub-panel-width)]';

/** Left offset for main content and page footer (so they start where sidebars end). */
export function getDashboardContentMarginLeft(isPinned: boolean, hasSubPanel: boolean): string {
  if (hasSubPanel) {
    return isPinned
      ? 'calc(var(--sidebar-width-expanded) + var(--sidebar-sub-panel-width))'
      : 'calc(var(--sidebar-width-collapsed) + var(--sidebar-sub-panel-width))';
  }

  return isPinned ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)';
}

/** Builder side-panels share the same width for visual symmetry. */
export const BUILDER_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

/** Right-hand settings panel in builder is wider for editing comfort. */
export const BUILDER_SETTINGS_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

// ── Footer (page + sidebar) ──────────────────────────────────────────

/** Height shared by dashboard page footer and sidebar footer (lock). */
export const DASHBOARD_FOOTER_HEIGHT_CLASS = 'h-12';

// ── Content area ────────────────────────────────────────────────────

export const DASHBOARD_CONTENT_PADDING = 'px-4 pt-6 pb-12 sm:px-6 lg:px-8';
export const DASHBOARD_CONTENT_MAX_WIDTH = 'w-full';
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

/** Routes rendered at full content width (survey list, archive). */
function isFullWidthPath(pathname: string): boolean {
  const path = pathWithoutLocale(pathname);

  return (
    path === ROUTES.dashboard.surveys ||
    path === ROUTES.dashboard.surveysArchive ||
    path.startsWith(ROUTES.dashboard.surveysArchive + '/')
  );
}

/** Routes rendered at narrow content width (builder, survey detail, settings, profile). */
function isNarrowPath(pathname: string): boolean {
  const path = pathWithoutLocale(pathname);

  if (path === ROUTES.dashboard.surveysNew || path.startsWith(ROUTES.dashboard.surveysNew + '/')) {
    return true;
  }

  if (/^\/dashboard\/surveys\/[^/]+$/.test(path) && path !== ROUTES.dashboard.surveysArchive) {
    return true;
  }

  if (
    path === ROUTES.common.settings ||
    path.startsWith(ROUTES.common.settings + '/') ||
    path === '/profile' ||
    path.startsWith('/profile/')
  ) {
    return true;
  }

  return false;
}

/**
 * Content width per route: full (list views, archive), content (default), narrow (forms/settings).
 * Used by DashboardContent to wrap children in DashboardContentArea with the right max-width.
 */
export function getDashboardContentMaxWidth(pathname: string | null): DashboardContentWidth {
  if (!pathname) {
    return 'content';
  }

  if (isNarrowPath(pathname)) {
    return 'narrow';
  }

  if (isFullWidthPath(pathname)) {
    return 'full';
  }

  return 'content';
}
