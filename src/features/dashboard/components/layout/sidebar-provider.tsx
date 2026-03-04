'use client';

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import type { NavItem } from '@/features/dashboard/config/navigation';
import { findActiveNavItem } from '@/features/dashboard/lib/nav-utils';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { usePathname } from '@/i18n/routing';

const STORAGE_KEY_PINNED = 'sidebar-pinned';
const STORAGE_KEY_SUBPANEL = 'sidebar-subpanel-visible';
const HOVER_DELAY = 75;
const pinnedListeners = new Set<() => void>();
const subPanelListeners = new Set<() => void>();

function subscribePinned(callback: () => void) {
  pinnedListeners.add(callback);

  return () => pinnedListeners.delete(callback);
}

function getPinnedSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_PINNED) === 'true';
  } catch {
    return false;
  }
}

function getPinnedServerSnapshot(): boolean {
  return false;
}

function writePinned(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_PINNED, String(next));
  } catch {}

  pinnedListeners.forEach((cb) => cb());
}

function subscribeSubPanelVisible(callback: () => void) {
  subPanelListeners.add(callback);

  return () => subPanelListeners.delete(callback);
}

function getSubPanelVisibleSnapshot(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUBPANEL);

    return stored === null || stored === 'true';
  } catch {
    return true;
  }
}

function getSubPanelVisibleServerSnapshot(): boolean {
  return true;
}

function writeSubPanelVisible(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_SUBPANEL, String(next));
  } catch {}

  subPanelListeners.forEach((cb) => cb());
}

interface SidebarContextValue {
  isExpanded: boolean;
  isPinned: boolean;
  isMobileOpen: boolean;
  togglePin: () => void;
  setMobileOpen: (open: boolean) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  isDesktop: boolean;
  hasSubPanel: boolean;
  /** Sub-panel is available for current section and user has it visible (desktop). */
  subPanelVisible: boolean;
  subPanelOpen: boolean;
  toggleSubPanel: () => void;
  activeNavItem: NavItem | undefined;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);

  if (!ctx) {
    throw new Error('useSidebar must be used within <SidebarProvider>');
  }

  return ctx;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const isDesktop = useBreakpoint('dashboard');
  const pathname = usePathname();

  const isPinned = useSyncExternalStore(
    subscribePinned,
    getPinnedSnapshot,
    getPinnedServerSnapshot
  );

  const subPanelOpen = useSyncExternalStore(
    subscribeSubPanelVisible,
    getSubPanelVisibleSnapshot,
    getSubPanelVisibleServerSnapshot
  );

  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpenRaw, setMobileOpenRaw] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobileOpen = isMobileOpenRaw;
  const activeNavItem = findActiveNavItem(pathname);
  const hasSubPanel = activeNavItem !== undefined;
  const subPanelVisible = hasSubPanel && subPanelOpen;

  const togglePin = () => {
    writePinned(!getPinnedSnapshot());
  };

  const toggleSubPanel = () => {
    writeSubPanelVisible(!getSubPanelVisibleSnapshot());
  };

  const handleMouseEnter = () => {
    if (getPinnedSnapshot()) {
      return;
    }

    hoverTimerRef.current = setTimeout(() => setIsHovered(true), HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    setIsHovered(false);
  };

  const setMobileOpen = (open: boolean) => {
    setMobileOpenRaw(open);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const isExpanded = isPinned || isHovered;

  const value: SidebarContextValue = {
    isExpanded,
    isPinned,
    isMobileOpen,
    togglePin,
    setMobileOpen,
    handleMouseEnter,
    handleMouseLeave,
    isDesktop,
    hasSubPanel,
    subPanelVisible,
    subPanelOpen,
    toggleSubPanel,
    activeNavItem,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
