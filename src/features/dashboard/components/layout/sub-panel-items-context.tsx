'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { LucideIcon } from 'lucide-react';

export interface SubPanelLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SubPanelItemsContextValue {
  links: SubPanelLink[];
  setLinks: (links: SubPanelLink[]) => void;
}

const SubPanelItemsContext = createContext<SubPanelItemsContextValue | null>(null);

export function SubPanelItemsProvider({ children }: { children: ReactNode }) {
  const [links, setLinksRaw] = useState<SubPanelLink[]>([]);

  const setLinks = useCallback((next: SubPanelLink[]) => {
    setLinksRaw(next);
  }, []);

  const value = useMemo(() => ({ links, setLinks }), [links, setLinks]);

  return <SubPanelItemsContext.Provider value={value}>{children}</SubPanelItemsContext.Provider>;
}

/**
 * Register additional sub-panel links for the current page.
 * Links are automatically cleared on unmount.
 */
export function useSubPanelLinks(links: SubPanelLink[]) {
  const ctx = useContext(SubPanelItemsContext);
  const setLinks = ctx?.setLinks;

  // Stable key derived from hrefs + labels to avoid re-triggering on referential changes
  const key = links.map((l) => `${l.href}:${l.label}`).join('|');

  useEffect(() => {
    if (!setLinks) {
      return;
    }

    setLinks(links);

    return () => setLinks([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures link identity
  }, [key, setLinks]);
}

export function useSubPanelItems() {
  return useContext(SubPanelItemsContext);
}
