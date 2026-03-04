'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

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

  const setLinks = (next: SubPanelLink[]) => {
    setLinksRaw(next);
  };

  const setBottomLinks = (next: SubPanelLink[]) => {
    setBottomLinksRaw(next);
  };

  const value: SubPanelItemsContextValue = { links, bottomLinks, setLinks, setBottomLinks };

  return <SubPanelItemsContext.Provider value={value}>{children}</SubPanelItemsContext.Provider>;
}

export function useSubPanelLinks(links: SubPanelLink[], bottomLinks?: SubPanelLink[]) {
  const ctx = useContext(SubPanelItemsContext);
  const setLinks = ctx?.setLinks;
  const setBottomLinks = ctx?.setBottomLinks;

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
