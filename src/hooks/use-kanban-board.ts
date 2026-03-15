'use client';

import { useEffect, useRef, useState } from 'react';

interface UseKanbanBoardOptions<TColumnId extends string> {
  /** Map of column IDs to arrays of item IDs in that column. */
  columns: Record<TColumnId, string[]>;
  /** All valid column IDs in display order. */
  columnIds: readonly TColumnId[];
  /** Ref to the board container that wraps all columns. */
  boardRef: React.RefObject<HTMLElement | null>;
  /** Data attribute on each column element, e.g. 'data-column-id'. */
  columnIdAttribute: string;
  /** Data attribute on each item element, e.g. 'data-insight-id'. */
  itemIdAttribute: string;
  /** Called when item is reordered within the same column. */
  onReorder: (columnId: TColumnId, newIds: string[]) => void;
  /** Called when item is moved to a different column. */
  onMove: (
    itemId: string,
    fromColumn: TColumnId,
    toColumn: TColumnId,
    targetColumnIds: string[],
    sourceColumnIds: string[]
  ) => void;
  /** Columns that cannot receive drops. Pointer still tracks but no placeholder/hover is shown. */
  disabledColumns?: readonly TColumnId[];
}

interface UseKanbanBoardResult {
  /** Id of the item currently being dragged, or null. */
  draggedId: string | null;
  /** Column from which the item was picked up. */
  draggedFromColumn: string | null;
  /** Column the pointer is currently hovering over during a drag. */
  hoveredColumn: string | null;
  /** Index within the hovered column where the item will be dropped. */
  placeholderIndex: number | null;
  /** Fixed position for the ghost (x, y in px). Null when not dragging. */
  ghostPosition: { x: number; y: number } | null;
  /** Width of the dragged card for the ghost (px). 0 when not dragging. */
  ghostWidth: number;
  /** Call when pointer goes down on the drag handle. */
  handleDragStart: (e: React.PointerEvent, itemId: string) => void;
  /** Whether this item is currently being dragged. */
  isDragging: (itemId: string) => boolean;
  /** Whether to show drop placeholder at this index in a column. */
  showPlaceholderAt: (columnId: string, index: number) => boolean;
  /** Whether to show placeholder after the last item in a column. */
  showPlaceholderAtEnd: (columnId: string) => boolean;
  /** Keyboard handler for arrow key movement. Attach to drag handle's onKeyDown. */
  handleKeyboardMove: (e: React.KeyboardEvent, itemId: string, currentColumnId: string) => void;
}

/** Find which column an item belongs to. */
function findItemColumn<TColumnId extends string>(
  columns: Record<TColumnId, string[]>,
  columnIds: readonly TColumnId[],
  itemId: string
): TColumnId | null {
  for (const colId of columnIds) {
    if (columns[colId].includes(itemId)) {
      return colId;
    }
  }

  return null;
}

/** Find which column the pointer is over by checking horizontal bounds. */
function findHoveredColumn(
  board: HTMLElement,
  columnIdAttribute: string,
  clientX: number,
  clientY: number
): string | null {
  const columnEls = board.querySelectorAll<HTMLElement>(`[${columnIdAttribute}]`);

  for (const col of columnEls) {
    const rect = col.getBoundingClientRect();

    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top - 40 &&
      clientY <= rect.bottom + 40
    ) {
      return col.getAttribute(columnIdAttribute);
    }
  }

  return null;
}

/** Compute drop index within a column based on pointer Y against item midpoints. */
function computeDropIndex(
  board: HTMLElement,
  columnIdAttribute: string,
  itemIdAttribute: string,
  columnId: string,
  itemIds: string[],
  clientY: number,
  draggedId: string
): number {
  const col = board.querySelector<HTMLElement>(`[${columnIdAttribute}="${columnId}"]`);

  if (!col) {
    return 0;
  }

  const fromIndex = itemIds.indexOf(draggedId);
  let newIndex = fromIndex >= 0 ? fromIndex : itemIds.length;

  for (let i = 0; i < itemIds.length; i++) {
    const id = itemIds[i]!;
    const el = col.querySelector<HTMLElement>(`[${itemIdAttribute}="${id}"]`);

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

export function useKanbanBoard<TColumnId extends string>(
  options: UseKanbanBoardOptions<TColumnId>
): UseKanbanBoardResult {
  const {
    columns,
    columnIds,
    boardRef,
    columnIdAttribute,
    itemIdAttribute,
    onReorder,
    onMove,
    disabledColumns,
  } = options;

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<TColumnId | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [ghostWidth, setGhostWidth] = useState(0);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const ghostPositionRef = useRef({ x: 0, y: 0 });
  const hoveredColumnRef = useRef<string | null>(null);
  const placeholderIndexRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const draggedFromColumnRef = useRef<TColumnId | null>(null);
  const columnsRef = useRef(columns);
  const columnIdsRef = useRef(columnIds);
  const disabledColumnsRef = useRef(disabledColumns);
  const pointerClientXRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    columnIdsRef.current = columnIds;
  }, [columnIds]);

  useEffect(() => {
    disabledColumnsRef.current = disabledColumns;
  }, [disabledColumns]);

  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>(() => {});
  const handlePointerUpRef = useRef<() => void>(() => {});

  // ── Auto-scroll the board container when dragging near edges ────
  const SCROLL_EDGE_PX = 60;
  const SCROLL_SPEED = 12;

  const startAutoScroll = () => {
    const tick = () => {
      const board = boardRef.current;

      if (!board || !draggedIdRef.current) {
        scrollRafRef.current = null;

        return;
      }

      const rect = board.getBoundingClientRect();
      const x = pointerClientXRef.current;
      const distFromLeft = x - rect.left;
      const distFromRight = rect.right - x;

      if (distFromLeft < SCROLL_EDGE_PX && board.scrollLeft > 0) {
        const intensity = 1 - distFromLeft / SCROLL_EDGE_PX;
        board.scrollLeft -= Math.ceil(SCROLL_SPEED * intensity);
      } else if (
        distFromRight < SCROLL_EDGE_PX &&
        board.scrollLeft < board.scrollWidth - board.clientWidth
      ) {
        const intensity = 1 - distFromRight / SCROLL_EDGE_PX;
        board.scrollLeft += Math.ceil(SCROLL_SPEED * intensity);
      }

      scrollRafRef.current = requestAnimationFrame(tick);
    };

    scrollRafRef.current = requestAnimationFrame(tick);
  };

  const stopAutoScroll = () => {
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  const handleDragStart = (e: React.PointerEvent, itemId: string) => {
    e.stopPropagation();

    const board = boardRef.current;

    if (!board) {
      return;
    }

    // Find the card element
    const cardEl = board.querySelector<HTMLElement>(`[${itemIdAttribute}="${itemId}"]`);

    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();

      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      setGhostWidth(rect.width);
      ghostPositionRef.current = { x: rect.left, y: rect.top };
      setGhostPosition({ x: rect.left, y: rect.top });
    }

    const fromColumn = findItemColumn(columns, columnIds, itemId);

    if (!fromColumn) {
      return;
    }

    const fromIndex = columns[fromColumn].indexOf(itemId);

    hoveredColumnRef.current = fromColumn;
    placeholderIndexRef.current = fromIndex >= 0 ? fromIndex : 0;
    draggedIdRef.current = itemId;
    draggedFromColumnRef.current = fromColumn;
    pointerClientXRef.current = e.clientX;

    setDraggedId(itemId);
    setDraggedFromColumn(fromColumn);
    setHoveredColumn(fromColumn);
    setPlaceholderIndex(placeholderIndexRef.current);

    startAutoScroll();
  };

  useEffect(() => {
    handlePointerMoveRef.current = (e: PointerEvent) => {
      const currentDraggedId = draggedIdRef.current;

      if (!currentDraggedId) {
        return;
      }

      pointerClientXRef.current = e.clientX;

      const x = e.clientX - dragOffsetRef.current.x;
      const y = e.clientY - dragOffsetRef.current.y;

      ghostPositionRef.current = { x, y };

      const board = boardRef.current;

      if (board) {
        const hCol = findHoveredColumn(board, columnIdAttribute, e.clientX, e.clientY);

        if (hCol && columnIdsRef.current.includes(hCol as TColumnId)) {
          const isDisabled = disabledColumnsRef.current?.includes(hCol as TColumnId) ?? false;

          if (isDisabled) {
            hoveredColumnRef.current = null;
          } else {
            hoveredColumnRef.current = hCol;
            const colItems = columnsRef.current[hCol as TColumnId] ?? [];
            const dropIdx = computeDropIndex(
              board,
              columnIdAttribute,
              itemIdAttribute,
              hCol,
              colItems,
              e.clientY,
              currentDraggedId
            );

            placeholderIndexRef.current = dropIdx;
          }
        } else {
          // Pointer is outside all columns — clear hover so drop is a no-op
          hoveredColumnRef.current = null;
        }
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          const isOverColumn = hoveredColumnRef.current !== null;

          setGhostPosition(ghostPositionRef.current);
          setHoveredColumn(hoveredColumnRef.current);
          setPlaceholderIndex(isOverColumn ? placeholderIndexRef.current : null);
        });
      }
    };

    handlePointerUpRef.current = () => {
      const currentDraggedId = draggedIdRef.current;
      const fromColumn = draggedFromColumnRef.current;

      stopAutoScroll();

      if (!currentDraggedId || !fromColumn) {
        return;
      }

      draggedIdRef.current = null;
      draggedFromColumnRef.current = null;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const targetColumn = hoveredColumnRef.current as TColumnId | null;

      if (!targetColumn) {
        // Dropped outside all columns — no-op
        setDraggedId(null);
        setDraggedFromColumn(null);
        setHoveredColumn(null);
        setPlaceholderIndex(null);
        setGhostPosition(null);
        setGhostWidth(0);

        return;
      }

      const cols = columnsRef.current;
      const toIndex = placeholderIndexRef.current;

      if (targetColumn === fromColumn) {
        // Same column reorder
        const ids = [...cols[fromColumn]];
        const fromIndex = ids.indexOf(currentDraggedId);

        if (fromIndex !== -1 && fromIndex !== toIndex) {
          const [removed] = ids.splice(fromIndex, 1);
          const insertAt = fromIndex < toIndex ? Math.min(toIndex - 1, ids.length) : toIndex;

          ids.splice(insertAt, 0, removed!);
          onReorder(fromColumn, ids);
        }
      } else {
        // Cross-column move
        const sourceIds = cols[fromColumn].filter((id) => id !== currentDraggedId);
        const targetIds = [...cols[targetColumn]];
        const insertAt = Math.min(toIndex, targetIds.length);

        targetIds.splice(insertAt, 0, currentDraggedId);

        onMove(currentDraggedId, fromColumn, targetColumn, targetIds, sourceIds);
      }

      setDraggedId(null);
      setDraggedFromColumn(null);
      setHoveredColumn(null);
      setPlaceholderIndex(null);
      setGhostPosition(null);
      setGhostWidth(0);
    };
  }, [boardRef, columnIdAttribute, itemIdAttribute, onReorder, onMove]);

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
      stopAutoScroll();

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [draggedId]);

  const showPlaceholderAt = (columnId: string, index: number) => {
    if (!draggedId || hoveredColumn !== columnId || placeholderIndex !== index) {
      return false;
    }

    // If same column, don't show placeholder at the dragged item's own position
    if (draggedFromColumn === columnId) {
      const fromIdx = columns[columnId as TColumnId]?.indexOf(draggedId) ?? -1;

      if (fromIdx === index) {
        return false;
      }
    }

    return true;
  };

  const showPlaceholderAtEnd = (columnId: string) => {
    if (!draggedId || hoveredColumn !== columnId) {
      return false;
    }

    const colItems = columns[columnId as TColumnId] ?? [];
    const isAtEnd = placeholderIndex === colItems.length;

    if (!isAtEnd) {
      return false;
    }

    // If same column, check if dragged from last position
    if (draggedFromColumn === columnId) {
      const fromIdx = colItems.indexOf(draggedId);

      if (fromIdx === colItems.length - 1) {
        return false;
      }
    }

    return true;
  };

  const handleKeyboardMove = (e: React.KeyboardEvent, itemId: string, currentColumnId: string) => {
    const isVertical = e.key === 'ArrowUp' || e.key === 'ArrowDown';
    const isHorizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight';

    if (!isVertical && !isHorizontal) {
      return;
    }

    e.preventDefault();
    const colId = currentColumnId as TColumnId;
    const colItems = columns[colId];

    if (isVertical) {
      const currentIndex = colItems.indexOf(itemId);

      if (currentIndex === -1) {
        return;
      }

      const newIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= colItems.length) {
        return;
      }

      const newIds = [...colItems];
      const moved = newIds.splice(currentIndex, 1)[0]!;
      newIds.splice(newIndex, 0, moved);
      onReorder(colId, newIds);
    }

    if (isHorizontal) {
      const colIdx = columnIds.indexOf(colId);
      const targetColIdx = e.key === 'ArrowLeft' ? colIdx - 1 : colIdx + 1;

      if (targetColIdx < 0 || targetColIdx >= columnIds.length) {
        return;
      }

      const targetColId = columnIds[targetColIdx];

      if (!targetColId || disabledColumns?.includes(targetColId)) {
        return;
      }

      const sourceIds = colItems.filter((id) => id !== itemId);
      const targetIds = [...columns[targetColId], itemId];
      onMove(itemId, colId, targetColId, targetIds, sourceIds);
    }
  };

  return {
    draggedId,
    draggedFromColumn,
    hoveredColumn,
    placeholderIndex,
    ghostPosition,
    ghostWidth,
    handleDragStart,
    handleKeyboardMove,
    isDragging: (id: string) => draggedId === id,
    showPlaceholderAt,
    showPlaceholderAtEnd,
  };
}
