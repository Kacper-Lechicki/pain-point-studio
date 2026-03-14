'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref and the element's content rect size. Updates on resize.
 * Use for charts that need explicit pixel dimensions (e.g. Recharts ResponsiveContainer).
 */
export function useElementSize<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  { width: number; height: number },
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const setSizeFromEntry = (entry: ResizeObserverEntry) => {
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSizeFromEntry(entry);
      }
    });
    observer.observe(el);

    // Initial size from getBoundingClientRect in case contentRect is 0 on first frame
    const rect = el.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      setSize({ width: rect.width, height: rect.height });
    }

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
