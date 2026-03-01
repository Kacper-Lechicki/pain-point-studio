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
  disabled?: boolean;
}

interface SubPanelItemsContextValue {
  links: SubPanelLink[];
  bottomLinks: SubPanelLink[];
  setLinks: (links: SubPanelLink[]) => void;
  setBottomLinks: (links: SubPanelLink[]) => void;
}

const SubPanelItemsContext = createContext<SubPanelItemsContextValue | null>(null);

export function SubPanelItemsProvider({ children }: { children: ReactNode }) {
  const [links, setLinksRaw] = useState<SubPanelLink[]>([]);
  const [bottomLinks, setBottomLinksRaw] = useState<SubPanelLink[]>([]);

  const setLinks = useCallback((next: SubPanelLink[]) => {
    setLinksRaw(next);
  }, []);

  const setBottomLinks = useCallback((next: SubPanelLink[]) => {
    setBottomLinksRaw(next);
  }, []);

  const value = useMemo(
    () => ({ links, bottomLinks, setLinks, setBottomLinks }),
    [links, bottomLinks, setLinks, setBottomLinks]
  );

  return <SubPanelItemsContext.Provider value={value}>{children}</SubPanelItemsContext.Provider>;
}

/**
 * Register additional sub-panel links for the current page.
 * `links` appear above the title, `bottomLinks` appear below the active item.
 * Links are automatically cleared on unmount.
 */
export function useSubPanelLinks(links: SubPanelLink[], bottomLinks?: SubPanelLink[]) {
  const ctx = useContext(SubPanelItemsContext);
  const setLinks = ctx?.setLinks;
  const setBottomLinks = ctx?.setBottomLinks;

  // Stable key derived from hrefs + labels to avoid re-triggering on referential changes
  const key = links.map((l) => `${l.href}:${l.label}`).join('|');
  const bottomKey = bottomLinks?.map((l) => `${l.href}:${l.label}`).join('|') ?? '';

  useEffect(() => {
    if (!setLinks || !setBottomLinks) {
      return;
    }

    setLinks(links);
    setBottomLinks(bottomLinks ?? []);

    return () => {
      setLinks([]);
      setBottomLinks([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures link identity
  }, [key, bottomKey, setLinks, setBottomLinks]);
}

export function useSubPanelItems() {
  return useContext(SubPanelItemsContext);
}
