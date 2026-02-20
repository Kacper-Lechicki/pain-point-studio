'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { type NavItem, findActiveNavItem } from '@/features/dashboard/config/navigation';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { usePathname } from '@/i18n/routing';

const STORAGE_KEY = 'sidebar-pinned';
const HOVER_DELAY = 75;
const pinnedListeners = new Set<() => void>();

function subscribePinned(callback: () => void) {
  pinnedListeners.add(callback);

  return () => {
    pinnedListeners.delete(callback);
  };
}

function getPinnedSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getPinnedServerSnapshot(): boolean {
  return false;
}

function writePinned(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {}

  pinnedListeners.forEach((cb) => cb());
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

  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpenRaw, setMobileOpenRaw] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobileOpen = isMobileOpenRaw;
  const activeNavItem = findActiveNavItem(pathname);
  const hasSubPanel = activeNavItem !== undefined;

  const togglePin = useCallback(() => {
    writePinned(!getPinnedSnapshot());
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (getPinnedSnapshot()) {
      return;
    }

    hoverTimerRef.current = setTimeout(() => setIsHovered(true), HOVER_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    setIsHovered(false);
  }, []);

  const setMobileOpen = useCallback((open: boolean) => {
    setMobileOpenRaw(open);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const isExpanded = isPinned || isHovered;

  const value = useMemo<SidebarContextValue>(
    () => ({
      isExpanded,
      isPinned,
      isMobileOpen,
      togglePin,
      setMobileOpen,
      handleMouseEnter,
      handleMouseLeave,
      isDesktop,
      hasSubPanel,
      activeNavItem,
    }),
    [
      isExpanded,
      isPinned,
      isMobileOpen,
      togglePin,
      setMobileOpen,
      handleMouseEnter,
      handleMouseLeave,
      isDesktop,
      hasSubPanel,
      activeNavItem,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
