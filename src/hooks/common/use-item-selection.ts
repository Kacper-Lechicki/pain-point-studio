'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// ── Types ───────────────────────────────────────────────────────────

interface UseItemSelectionOptions<TItem extends { id: string }, TDetail> {
  /** The full list of items (used to resolve `selectedItem` by ID). */
  items: TItem[];
  /** Fetches detail data for a given item ID. */
  fetchDetail: (id: string) => Promise<TDetail | null>;
}

export interface UseItemSelectionReturn<TItem, TDetail> {
  selectedId: string | null;
  selectedItem: TItem | null;
  detailData: TDetail | null;
  showSheet: boolean;
  setSelected: (id: string | null) => void;
}

// ── Hook ────────────────────────────────────────────────────────────

/**
 * Generic hook for list-to-detail selection via `?selected=ID` URL param.
 *
 * Manages: URL param sync, detail data fetching with deduplication,
 * stale-data preservation during close animations.
 */
export function useItemSelection<TItem extends { id: string }, TDetail>({
  items,
  fetchDetail,
}: UseItemSelectionOptions<TItem, TDetail>): UseItemSelectionReturn<TItem, TDetail> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selected');
  const [detailData, setDetailData] = useState<TDetail | null>(null);
  const fetchedForRef = useRef<string | null>(null);

  // Fetch detail when selection changes
  useEffect(() => {
    if (!selectedId || fetchedForRef.current === selectedId) {
      return;
    }

    fetchedForRef.current = selectedId;
    queueMicrotask(() => setDetailData(null));

    fetchDetail(selectedId)
      .then((data) => {
        if (data && fetchedForRef.current === selectedId) {
          setDetailData(data);
        }
      })
      .catch(() => {});
  }, [selectedId, fetchDetail]);

  const selectedItem = useMemo(
    () => (selectedId ? (items.find((item) => item.id === selectedId) ?? null) : null),
    [items, selectedId]
  );

  const setSelected = useCallback(
    (id: string | null) => {
      if (id !== selectedId) {
        fetchedForRef.current = null;

        // Only reset detail when switching to another item.
        // When deselecting (id=null), keep stale data so the closing
        // sheet animation doesn't flash a loading spinner.
        if (id) {
          setDetailData(null);
        }
      }

      const next = new URLSearchParams(searchParams.toString());

      if (id) {
        next.set('selected', id);
      } else {
        next.delete('selected');
      }

      const q = next.toString();

      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [selectedId, searchParams, router, pathname]
  );

  const showSheet = !!selectedId && !!selectedItem;

  return { selectedId, selectedItem, detailData, showSheet, setSelected };
}
