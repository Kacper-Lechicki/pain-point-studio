'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import type { LucideIcon } from 'lucide-react';

import type { MessageKey } from '@/i18n/types';

export interface SubPanelLink {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface SubPanelAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'warning' | 'accent';
  disabled?: boolean;
}

interface SubPanelItemsContextValue {
  links: SubPanelLink[];
  bottomLinks: SubPanelLink[];
  footerLinks: SubPanelLink[];
  actions: SubPanelAction[];
  titleKey: MessageKey | null;
  setLinks: (links: SubPanelLink[]) => void;
  setBottomLinks: (links: SubPanelLink[]) => void;
  setFooterLinks: (links: SubPanelLink[]) => void;
  setActions: (actions: SubPanelAction[]) => void;
  setTitleKey: (key: MessageKey | null) => void;
}

const SubPanelItemsContext = createContext<SubPanelItemsContextValue | null>(null);

export function SubPanelItemsProvider({ children }: { children: ReactNode }) {
  const [links, setLinksRaw] = useState<SubPanelLink[]>([]);
  const [bottomLinks, setBottomLinksRaw] = useState<SubPanelLink[]>([]);
  const [footerLinks, setFooterLinksRaw] = useState<SubPanelLink[]>([]);
  const [actions, setActionsRaw] = useState<SubPanelAction[]>([]);
  const [titleKey, setTitleKeyRaw] = useState<MessageKey | null>(null);

  const setLinks = (next: SubPanelLink[]) => {
    setLinksRaw(next);
  };

  const setBottomLinks = (next: SubPanelLink[]) => {
    setBottomLinksRaw(next);
  };

  const setFooterLinks = (next: SubPanelLink[]) => {
    setFooterLinksRaw(next);
  };

  const setActions = (next: SubPanelAction[]) => {
    setActionsRaw(next);
  };

  const setTitleKey = (key: MessageKey | null) => {
    setTitleKeyRaw(key);
  };

  const value: SubPanelItemsContextValue = {
    links,
    bottomLinks,
    footerLinks,
    actions,
    titleKey,
    setLinks,
    setBottomLinks,
    setFooterLinks,
    setActions,
    setTitleKey,
  };

  return <SubPanelItemsContext.Provider value={value}>{children}</SubPanelItemsContext.Provider>;
}

interface UseSubPanelLinksOptions {
  links: SubPanelLink[];
  bottomLinks?: SubPanelLink[];
  footerLinks?: SubPanelLink[];
  actions?: SubPanelAction[];
  titleKey?: MessageKey;
}

export function useSubPanelLinks(
  linksOrOptions: SubPanelLink[] | UseSubPanelLinksOptions,
  bottomLinks?: SubPanelLink[]
) {
  const ctx = useContext(SubPanelItemsContext);
  const setLinks = ctx?.setLinks;
  const setBottomLinks = ctx?.setBottomLinks;
  const setFooterLinks = ctx?.setFooterLinks;
  const setActions = ctx?.setActions;
  const setTitleKey = ctx?.setTitleKey;

  const isOptions = !Array.isArray(linksOrOptions);
  const resolvedLinks = isOptions ? linksOrOptions.links : linksOrOptions;
  const resolvedBottomLinks = isOptions ? linksOrOptions.bottomLinks : bottomLinks;
  const resolvedFooterLinks = isOptions ? linksOrOptions.footerLinks : undefined;
  const resolvedActions = isOptions ? linksOrOptions.actions : undefined;
  const resolvedTitleKey = isOptions ? linksOrOptions.titleKey : undefined;

  const key = resolvedLinks.map((l) => `${l.href}:${l.label}`).join('|');
  const bottomKey = resolvedBottomLinks?.map((l) => `${l.href}:${l.label}`).join('|') ?? '';
  const footerKey = resolvedFooterLinks?.map((l) => `${l.href}:${l.label}`).join('|') ?? '';
  const actionsKey = resolvedActions?.map((a) => `${a.label}:${a.variant ?? ''}`).join('|') ?? '';

  useEffect(() => {
    if (!setLinks || !setBottomLinks || !setFooterLinks || !setActions || !setTitleKey) {
      return;
    }

    setLinks(resolvedLinks);
    setBottomLinks(resolvedBottomLinks ?? []);
    setFooterLinks(resolvedFooterLinks ?? []);
    setActions(resolvedActions ?? []);
    setTitleKey(resolvedTitleKey ?? null);

    return () => {
      setLinks([]);
      setBottomLinks([]);
      setFooterLinks([]);
      setActions([]);
      setTitleKey(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures link identity
  }, [
    key,
    bottomKey,
    footerKey,
    actionsKey,
    resolvedTitleKey,
    setLinks,
    setBottomLinks,
    setFooterLinks,
    setActions,
    setTitleKey,
  ]);
}

export function useSubPanelItems() {
  return useContext(SubPanelItemsContext);
}
