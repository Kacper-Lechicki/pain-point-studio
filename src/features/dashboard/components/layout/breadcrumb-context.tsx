'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

type SegmentMap = Record<string, string>;

interface BreadcrumbContextValue {
  segments: SegmentMap;
  setSegment: (segment: string, label: string) => void;
  removeSegment: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<SegmentMap>({});

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

  const value: BreadcrumbContextValue = { segments, setSegment, removeSegment };

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

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}
