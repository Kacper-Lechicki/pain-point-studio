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
  footerLinks: SubPanelLink[];
  setLinks: (links: SubPanelLink[]) => void;
  setBottomLinks: (links: SubPanelLink[]) => void;
  setFooterLinks: (links: SubPanelLink[]) => void;
}

const SubPanelItemsContext = createContext<SubPanelItemsContextValue | null>(null);

export function SubPanelItemsProvider({ children }: { children: ReactNode }) {
  const [links, setLinksRaw] = useState<SubPanelLink[]>([]);
  const [bottomLinks, setBottomLinksRaw] = useState<SubPanelLink[]>([]);
  const [footerLinks, setFooterLinksRaw] = useState<SubPanelLink[]>([]);

  const setLinks = (next: SubPanelLink[]) => {
    setLinksRaw(next);
  };

  const setBottomLinks = (next: SubPanelLink[]) => {
    setBottomLinksRaw(next);
  };

  const setFooterLinks = (next: SubPanelLink[]) => {
    setFooterLinksRaw(next);
  };

  const value: SubPanelItemsContextValue = {
    links,
    bottomLinks,
    footerLinks,
    setLinks,
    setBottomLinks,
    setFooterLinks,
  };

  return <SubPanelItemsContext.Provider value={value}>{children}</SubPanelItemsContext.Provider>;
}

interface UseSubPanelLinksOptions {
  links: SubPanelLink[];
  bottomLinks?: SubPanelLink[];
  footerLinks?: SubPanelLink[];
}

export function useSubPanelLinks(
  linksOrOptions: SubPanelLink[] | UseSubPanelLinksOptions,
  bottomLinks?: SubPanelLink[]
) {
  const ctx = useContext(SubPanelItemsContext);
  const setLinks = ctx?.setLinks;
  const setBottomLinks = ctx?.setBottomLinks;
  const setFooterLinks = ctx?.setFooterLinks;

  const isOptions = !Array.isArray(linksOrOptions);
  const resolvedLinks = isOptions ? linksOrOptions.links : linksOrOptions;
  const resolvedBottomLinks = isOptions ? linksOrOptions.bottomLinks : bottomLinks;
  const resolvedFooterLinks = isOptions ? linksOrOptions.footerLinks : undefined;

  const key = resolvedLinks.map((l) => `${l.href}:${l.label}`).join('|');
  const bottomKey = resolvedBottomLinks?.map((l) => `${l.href}:${l.label}`).join('|') ?? '';
  const footerKey = resolvedFooterLinks?.map((l) => `${l.href}:${l.label}`).join('|') ?? '';

  useEffect(() => {
    if (!setLinks || !setBottomLinks || !setFooterLinks) {
      return;
    }

    setLinks(resolvedLinks);
    setBottomLinks(resolvedBottomLinks ?? []);
    setFooterLinks(resolvedFooterLinks ?? []);

    return () => {
      setLinks([]);
      setBottomLinks([]);
      setFooterLinks([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures link identity
  }, [key, bottomKey, footerKey, setLinks, setBottomLinks, setFooterLinks]);
}

export function useSubPanelItems() {
  return useContext(SubPanelItemsContext);
}
