'use client';

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Lightweight context that lets page-level components register dynamic
 * breadcrumb labels for URL segments the generic Breadcrumbs component
 * can't resolve from its static SEGMENT_KEYS map (e.g. UUIDs → survey title).
 */

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

// ── Hook for page components to register a dynamic breadcrumb ────────

export function useBreadcrumbSegment(segment: string, label: string) {
  const ctx = useContext(BreadcrumbContext);

  useEffect(() => {
    if (!ctx) {
      return;
    }

    ctx.setSegment(segment, label);

    return () => ctx.removeSegment(segment);
    // setSegment and removeSegment are stable (useCallback), so we only
    // depend on the primitive values to avoid infinite re-render loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, label]);
}

// ── Hook for Breadcrumbs component to read dynamic segments ──────────

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}
