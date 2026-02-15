'use client';

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

type SegmentMap = Record<string, string>;

interface BreadcrumbContextValue {
  segments: SegmentMap;
  setSegment: (segment: string, label: string) => void;
  removeSegment: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<SegmentMap>({});

  const setSegment = useCallback((segment: string, label: string) => {
    setSegments((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
  }, []);

  const removeSegment = useCallback((segment: string) => {
    setSegments((prev) => {
      if (!(segment in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[segment];

      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ segments, setSegment, removeSegment }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbSegment(segment: string, label: string) {
  const ctx = useContext(BreadcrumbContext);

  useEffect(() => {
    if (!ctx) {
      return;
    }

    ctx.setSegment(segment, label);

    return () => ctx.removeSegment(segment);
  }, [segment, label, ctx]);
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}
