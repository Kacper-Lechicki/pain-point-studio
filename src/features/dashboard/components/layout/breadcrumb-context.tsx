'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

type SegmentMap = Record<string, string>;

export interface BreadcrumbCrumb {
  label: string;
  href: string;
}

interface BreadcrumbContextValue {
  segments: SegmentMap;
  setSegment: (segment: string, label: string) => void;
  removeSegment: (segment: string) => void;
  customTrail: BreadcrumbCrumb[] | null;
  setCustomTrail: (trail: BreadcrumbCrumb[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<SegmentMap>({});
  const [customTrail, setCustomTrail] = useState<BreadcrumbCrumb[] | null>(null);

  const setSegment = (segment: string, label: string) => {
    setSegments((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
  };

  const removeSegment = (segment: string) => {
    setSegments((prev) => {
      if (!(segment in prev)) {
        return prev;
      }

      const next = { ...prev };

      delete next[segment];

      return next;
    });
  };

  const value: BreadcrumbContextValue = {
    segments,
    setSegment,
    removeSegment,
    customTrail,
    setCustomTrail,
  };

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbSegment(segment: string, label: string) {
  const ctx = useContext(BreadcrumbContext);
  const setSegment = ctx?.setSegment;
  const removeSegment = ctx?.removeSegment;

  useEffect(() => {
    if (!setSegment || !removeSegment) {
      return;
    }

    setSegment(segment, label);

    return () => removeSegment(segment);
  }, [segment, label, setSegment, removeSegment]);
}

/**
 * Set a custom breadcrumb trail for the current page. When set, the breadcrumb
 * bar uses this trail instead of deriving from the URL path. Clear on unmount.
 */
export function useBreadcrumbTrail(trail: BreadcrumbCrumb[] | null) {
  const ctx = useContext(BreadcrumbContext);
  const setCustomTrail = ctx?.setCustomTrail;

  useEffect(() => {
    if (!setCustomTrail) {
      return;
    }

    setCustomTrail(trail?.length ? trail : null);

    return () => setCustomTrail(null);
  }, [trail, setCustomTrail]);
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}
