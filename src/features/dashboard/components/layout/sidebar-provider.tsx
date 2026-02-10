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

import { useBreakpoint } from '@/hooks/common/use-breakpoint';

const STORAGE_KEY = 'sidebar-pinned';
const HOVER_DELAY = 75;

// ── Pinned state as external store (localStorage) ──────────────────

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
  } catch {
    // localStorage unavailable
  }

  pinnedListeners.forEach((cb) => cb());
}

// ── Context ────────────────────────────────────────────────────────

interface SidebarContextValue {
  /** Whether the sidebar is visually expanded (hovered or pinned) */
  isExpanded: boolean;
  /** Whether the sidebar is locked open */
  isPinned: boolean;
  /** Whether the mobile sheet is open */
  isMobileOpen: boolean;
  /** Toggle pin state */
  togglePin: () => void;
  /** Set mobile sheet open state */
  setMobileOpen: (open: boolean) => void;
  /** Mouse enter handler for sidebar */
  handleMouseEnter: () => void;
  /** Mouse leave handler for sidebar */
  handleMouseLeave: () => void;
  /** Whether the viewport is at least lg */
  isDesktop: boolean;
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
  const isDesktop = useBreakpoint('lg');

  const isPinned = useSyncExternalStore(
    subscribePinned,
    getPinnedSnapshot,
    getPinnedServerSnapshot
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpenRaw, setMobileOpenRaw] = useState(false);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On desktop, mobile sheet is never open (derived state, no effect needed)
  const isMobileOpen = !isDesktop && isMobileOpenRaw;

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

  // Cleanup hover timer on unmount
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
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
