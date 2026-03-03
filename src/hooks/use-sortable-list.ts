'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSortableListOptions {
  /** Ordered list of item ids. */
  itemIds: string[];
  /** Ref to the scrollable container that wraps the list items. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Data attribute used to find item elements, e.g. 'data-item-id' or 'data-question-id'. */
  itemIdAttribute: string;
  /** Called with the new order of ids when a drop completes. */
  onReorder: (newIds: string[]) => void;
}

interface UseSortableListResult {
  /** Id of the item currently being dragged, or null. */
  draggedId: string | null;
  /** Index where the item will be dropped (0..itemIds.length). */
  placeholderIndex: number | null;
  /** Fixed position for the ghost (x, y in px). Null when not dragging. */
  ghostPosition: { x: number; y: number } | null;
  /** Width of the dragged row for the ghost (px). 0 when not dragging. */
  ghostWidth: number;
  /** Call when pointer goes down on the drag handle. Call setPointerCapture on the event target for smooth tracking. */
  handleDragStart: (e: React.PointerEvent, itemId: string) => void;
  /** Whether this item is currently being dragged. */
  isDragging: (itemId: string) => boolean;
  /** Whether to show the drop placeholder at this index (excludes the dragged item's own index). */
  showPlaceholderAt: (index: number) => boolean;
  /** Whether to show the placeholder after the last item (drop at end). */
  showPlaceholderAtEnd: boolean;
  /** Index of the dragged item in the list. -1 when not dragging. */
  draggedFromIndex: number;
}

function computeDropIndex(
  container: HTMLElement,
  itemIds: string[],
  itemIdAttribute: string,
  clientY: number,
  draggedId: string
): number {
  const fromIndex = itemIds.indexOf(draggedId);

  if (fromIndex === -1) {
    return fromIndex;
  }

  let newIndex = fromIndex;

  for (let i = 0; i < itemIds.length; i++) {
    const id = itemIds[i]!;
    const el = container.querySelector<HTMLElement>(`[${itemIdAttribute}="${id}"]`);

    if (!el) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;

    if (clientY <= mid) {
      newIndex = i;
      break;
    }

    newIndex = i + 1;
  }

  return Math.min(newIndex, itemIds.length);
}

export function useSortableList(options: UseSortableListOptions): UseSortableListResult {
  const { itemIds, containerRef, itemIdAttribute, onReorder } = options;
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [ghostWidth, setGhostWidth] = useState(0);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const ghostPositionRef = useRef({ x: 0, y: 0 });
  const placeholderIndexRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const itemIdsRef = useRef<string[]>(itemIds);

  useEffect(() => {
    itemIdsRef.current = itemIds;
  }, [itemIds]);

  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>(() => {});
  const handlePointerUpRef = useRef<() => void>(() => {});

  const handleDragStart = useCallback(
    (e: React.PointerEvent, itemId: string) => {
      e.stopPropagation();

      const container = containerRef.current;
      const row = container?.querySelector<HTMLElement>(`[${itemIdAttribute}="${itemId}"]`);

      if (row) {
        const rect = row.getBoundingClientRect();

        dragOffsetRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        setGhostWidth(rect.width);
        ghostPositionRef.current = { x: rect.left, y: rect.top };
        setGhostPosition({ x: rect.left, y: rect.top });
      }

      const fromIndex = itemIds.indexOf(itemId);

      placeholderIndexRef.current = fromIndex >= 0 ? fromIndex : 0;
      draggedIdRef.current = itemId;

      setDraggedId(itemId);
      setPlaceholderIndex(placeholderIndexRef.current);
    },
    [containerRef, itemIdAttribute, itemIds]
  );

  useEffect(() => {
    handlePointerMoveRef.current = (e: PointerEvent) => {
      const currentDraggedId = draggedIdRef.current;

      if (!currentDraggedId) {
        return;
      }

      const x = e.clientX - dragOffsetRef.current.x;
      const y = e.clientY - dragOffsetRef.current.y;

      ghostPositionRef.current = { x, y };

      const container = containerRef.current;

      if (container) {
        const newIndex = computeDropIndex(
          container,
          itemIdsRef.current,
          itemIdAttribute,
          e.clientY,
          currentDraggedId
        );

        placeholderIndexRef.current = newIndex;
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          setGhostPosition(ghostPositionRef.current);
          setPlaceholderIndex(placeholderIndexRef.current);
        });
      }
    };

    handlePointerUpRef.current = () => {
      const currentDraggedId = draggedIdRef.current;

      if (!currentDraggedId) {
        return;
      }

      draggedIdRef.current = null;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const ids = itemIdsRef.current;
      const fromIndex = ids.indexOf(currentDraggedId);
      const toIndex = placeholderIndexRef.current;

      if (fromIndex !== -1 && fromIndex !== toIndex) {
        const reordered = [...ids];
        const [removed] = reordered.splice(fromIndex, 1);
        const insertAt = fromIndex < toIndex ? Math.min(toIndex - 1, reordered.length) : toIndex;

        reordered.splice(insertAt, 0, removed!);
        onReorder(reordered);
      }

      setDraggedId(null);
      setPlaceholderIndex(null);
      setGhostPosition(null);
      setGhostWidth(0);
    };
  }, [containerRef, itemIdAttribute, onReorder]);

  useEffect(() => {
    if (!draggedId) {
      return;
    }

    const onMove = (e: PointerEvent) => handlePointerMoveRef.current(e);
    const onUp = () => handlePointerUpRef.current();
    const moveOpts: AddEventListenerOptions = { capture: true, passive: true };

    window.addEventListener('pointermove', onMove, moveOpts);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);

    return () => {
      window.removeEventListener('pointermove', onMove, moveOpts);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [draggedId]);

  const draggedFromIndex = draggedId ? itemIds.indexOf(draggedId) : -1;

  const showPlaceholderAt = useCallback(
    (index: number) =>
      Boolean(draggedId && placeholderIndex === index && placeholderIndex !== draggedFromIndex),
    [draggedId, placeholderIndex, draggedFromIndex]
  );

  const showPlaceholderAtEnd =
    Boolean(draggedId) &&
    placeholderIndex === itemIds.length &&
    placeholderIndex !== draggedFromIndex;

  return {
    draggedId,
    placeholderIndex,
    ghostPosition,
    ghostWidth,
    handleDragStart,
    isDragging: (id: string) => draggedId === id,
    showPlaceholderAt,
    showPlaceholderAtEnd,
    draggedFromIndex,
  };
}
