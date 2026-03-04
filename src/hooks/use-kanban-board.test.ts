/** useKanbanBoard hook: pointer-based multi-column drag-and-drop. */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKanbanBoard } from './use-kanban-board';

// ── Constants ────────────────────────────────────────────────────────

const COL_ATTR = 'data-column-id';
const ITEM_ATTR = 'data-insight-id';
const COL_WIDTH = 200;
const COL_GAP = 10;
const ITEM_HEIGHT = 60;

// ── DOM helper ───────────────────────────────────────────────────────

/**
 * Build a mock board DOM with multiple columns and items.
 * Columns are laid out side-by-side; items stacked vertically within each.
 */
function createBoard(layout: Record<string, string[]>): HTMLDivElement {
  const board = document.createElement('div');
  const colEntries = Object.entries(layout);

  colEntries.forEach(([colId, itemIds], colIndex) => {
    const colEl = document.createElement('div');
    const colLeft = colIndex * (COL_WIDTH + COL_GAP);

    colEl.setAttribute(COL_ATTR, colId);

    colEl.getBoundingClientRect = () => ({
      top: 0,
      bottom: 300,
      left: colLeft,
      right: colLeft + COL_WIDTH,
      width: COL_WIDTH,
      height: 300,
      x: colLeft,
      y: 0,
      toJSON: () => {},
    });

    itemIds.forEach((id, i) => {
      const el = document.createElement('div');

      el.setAttribute(ITEM_ATTR, id);

      el.getBoundingClientRect = () => ({
        top: i * ITEM_HEIGHT,
        bottom: (i + 1) * ITEM_HEIGHT,
        left: colLeft,
        right: colLeft + COL_WIDTH,
        width: COL_WIDTH,
        height: ITEM_HEIGHT,
        x: colLeft,
        y: i * ITEM_HEIGHT,
        toJSON: () => {},
      });

      colEl.appendChild(el);
    });

    board.appendChild(colEl);
  });

  document.body.appendChild(board);

  return board;
}

// ── Render helper ────────────────────────────────────────────────────

function renderKanban(
  columns: Record<string, string[]>,
  boardRef: React.RefObject<HTMLElement | null>,
  columnIds?: string[]
) {
  const onReorder = vi.fn();
  const onMove = vi.fn();
  const ids = columnIds ?? Object.keys(columns);

  const hookResult = renderHook(
    (props) =>
      useKanbanBoard({
        columns: props.columns,
        columnIds: props.columnIds,
        boardRef,
        columnIdAttribute: COL_ATTR,
        itemIdAttribute: ITEM_ATTR,
        onReorder,
        onMove,
      }),
    { initialProps: { columns, columnIds: ids } }
  );

  return { ...hookResult, onReorder, onMove };
}

// ── Drag helper ──────────────────────────────────────────────────────

function startDrag(
  result: { current: ReturnType<typeof useKanbanBoard> },
  itemId: string,
  clientX: number,
  clientY: number
) {
  act(() => {
    result.current.handleDragStart(
      {
        clientX,
        clientY,
        stopPropagation: vi.fn(),
      } as unknown as React.PointerEvent,
      itemId
    );
  });
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useKanbanBoard', () => {
  let board: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        cb(0);

        return 0;
      })
    );

    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    if (board?.parentNode) {
      document.body.removeChild(board);
    }

    vi.restoreAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────────

  describe('initial state', () => {
    it('should start with no drag state', () => {
      board = createBoard({ A: ['a1', 'a2'], B: ['b1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'], B: ['b1'] }, ref);

      expect(result.current.draggedId).toBeNull();
      expect(result.current.draggedFromColumn).toBeNull();
      expect(result.current.hoveredColumn).toBeNull();
      expect(result.current.placeholderIndex).toBeNull();
      expect(result.current.ghostPosition).toBeNull();
      expect(result.current.ghostWidth).toBe(0);
    });

    it('should return false for isDragging when idle', () => {
      board = createBoard({ A: ['a1'], B: ['b1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'], B: ['b1'] }, ref);

      expect(result.current.isDragging('a1')).toBe(false);
      expect(result.current.isDragging('b1')).toBe(false);
    });
  });

  // ── handleDragStart ────────────────────────────────────────────────

  describe('handleDragStart', () => {
    it('should set drag state on handleDragStart', () => {
      board = createBoard({ A: ['a1', 'a2'], B: ['b1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'], B: ['b1'] }, ref);

      // Start drag on a2 (index 1 in column A). clientX=100 is within column A (0..200).
      startDrag(result, 'a2', 100, ITEM_HEIGHT + 10);

      expect(result.current.draggedId).toBe('a2');
      expect(result.current.draggedFromColumn).toBe('A');
      expect(result.current.hoveredColumn).toBe('A');
      expect(result.current.placeholderIndex).toBe(1);
      expect(result.current.ghostPosition).not.toBeNull();
      expect(result.current.ghostWidth).toBe(COL_WIDTH);
      expect(result.current.isDragging('a2')).toBe(true);
      expect(result.current.isDragging('a1')).toBe(false);
    });

    it('should call stopPropagation on drag start', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'] }, ref);

      const stopPropagation = vi.fn();

      act(() => {
        result.current.handleDragStart(
          { clientX: 100, clientY: 10, stopPropagation } as unknown as React.PointerEvent,
          'a1'
        );
      });

      expect(stopPropagation).toHaveBeenCalled();
    });

    it('should bail out when boardRef.current is null', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: null };

      const { result } = renderKanban({ A: ['a1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      expect(result.current.draggedId).toBeNull();
    });

    it('should bail out when item is not in any column', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'] }, ref);

      startDrag(result, 'nonexistent', 100, 10);

      expect(result.current.draggedId).toBeNull();
    });
  });

  // ── Pointer move and column hover ──────────────────────────────────

  describe('pointer move and column hover', () => {
    it('should update hoveredColumn on pointermove', () => {
      board = createBoard({ A: ['a1', 'a2'], B: ['b1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'], B: ['b1'] }, ref);

      // Start drag on a1 in column A.
      startDrag(result, 'a1', 100, 10);

      expect(result.current.hoveredColumn).toBe('A');

      // Move pointer into column B (left=210, right=410). clientX=300 is within B.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 20 }));
      });

      expect(result.current.hoveredColumn).toBe('B');
    });

    it('should update placeholderIndex within hovered column', () => {
      board = createBoard({ A: ['a1'], B: ['b1', 'b2'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'], B: ['b1', 'b2'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B below b1 midpoint (mid = 30). clientY=40 is below mid.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 40 }));
      });

      expect(result.current.hoveredColumn).toBe('B');
      expect(result.current.placeholderIndex).toBe(1);
    });

    it('should detect column within vertical padding tolerance', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move pointer 30px above column A top (within 40px tolerance). Column top=0.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: -30 }));
      });

      expect(result.current.hoveredColumn).toBe('A');
    });
  });

  // ── Ghost position ─────────────────────────────────────────────────

  describe('ghost position', () => {
    it('should set ghostPosition from card rect on drag start', () => {
      board = createBoard({ A: ['a1', 'a2'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'] }, ref);

      // a2 is at index 1 → top = 60.
      startDrag(result, 'a2', 100, 70);

      expect(result.current.ghostPosition).toEqual({ x: 0, y: ITEM_HEIGHT });
    });

    it('should update ghostPosition on pointermove', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'] }, ref);

      // Start drag at clientX=50, clientY=10. Card at (0,0), so offset = (50, 10).
      startDrag(result, 'a1', 50, 10);

      // Move pointer to (200, 100). Ghost = (200-50, 100-10) = (150, 90).
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 100 }));
      });

      expect(result.current.ghostPosition).toEqual({ x: 150, y: 90 });
    });
  });

  // ── showPlaceholderAt and showPlaceholderAtEnd ─────────────────────

  describe('showPlaceholderAt and showPlaceholderAtEnd', () => {
    it('should not show placeholder at dragged items own index in same column', () => {
      board = createBoard({ A: ['a1', 'a2'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'] }, ref);

      // Drag a1 (index 0). Placeholder is at index 0 initially.
      startDrag(result, 'a1', 100, 10);

      expect(result.current.showPlaceholderAt('A', 0)).toBe(false);
    });

    it('should show placeholder at a different index in a different column', () => {
      board = createBoard({ A: ['a1'], B: ['b1', 'b2'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'], B: ['b1', 'b2'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B at index 0.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 10 }));
      });

      expect(result.current.showPlaceholderAt('B', 0)).toBe(true);
    });

    it('should show placeholder at end of column', () => {
      board = createBoard({ A: ['a1'], B: ['b1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'], B: ['b1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B below b1 midpoint. b1 mid = 30. clientY=50 → index 1 = colItems.length.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }));
      });

      expect(result.current.showPlaceholderAtEnd('B')).toBe(true);
    });

    it('should not show placeholder at end when dragged from last position in same column', () => {
      board = createBoard({ A: ['a1', 'a2'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'] }, ref);

      // Drag a2 (last item, index 1). Move below all items so placeholder = colItems.length.
      startDrag(result, 'a2', 100, ITEM_HEIGHT + 10);

      // Move pointer below all items in column A. Last item bottom = 120. clientY=130.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 130 }));
      });

      expect(result.current.showPlaceholderAtEnd('A')).toBe(false);
    });
  });

  // ── Same-column reorder ────────────────────────────────────────────

  describe('same-column reorder', () => {
    it('should call onReorder when item is moved to a new position', () => {
      board = createBoard({ A: ['a1', 'a2', 'a3'], B: [] });
      const ref = { current: board };

      const { result, onReorder, onMove } = renderKanban({ A: ['a1', 'a2', 'a3'], B: [] }, ref);

      // Drag a1 (index 0).
      startDrag(result, 'a1', 100, 10);

      // Move below a2 midpoint (a2 mid = 90). clientY=100 → placeholder at index 2.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
      });

      // Drop.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      // fromIndex=0, toIndex=2, fromIndex < toIndex → insertAt = min(2-1, 2) = 1.
      // splice(0,1) removes a1 → ['a2','a3'], then splice(1,0,'a1') → ['a2','a1','a3'].
      expect(onReorder).toHaveBeenCalledWith('A', ['a2', 'a1', 'a3']);
      expect(onMove).not.toHaveBeenCalled();
    });

    it('should not call onReorder when dropped at same position', () => {
      board = createBoard({ A: ['a1', 'a2'] });
      const ref = { current: board };

      const { result, onReorder } = renderKanban({ A: ['a1', 'a2'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Drop without moving.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should handle reorder from higher index to lower index', () => {
      board = createBoard({ A: ['a1', 'a2', 'a3'] });
      const ref = { current: board };

      const { result, onReorder } = renderKanban({ A: ['a1', 'a2', 'a3'] }, ref);

      // Drag a3 (index 2).
      startDrag(result, 'a3', 100, ITEM_HEIGHT * 2 + 10);

      // Move above a1 midpoint (a1 mid = 30). clientY=20 → placeholder at index 0.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 20 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      // fromIndex=2, toIndex=0, fromIndex > toIndex → insertAt = 0.
      // splice(2,1) removes a3 → ['a1','a2'], then splice(0,0,'a3') → ['a3','a1','a2'].
      expect(onReorder).toHaveBeenCalledWith('A', ['a3', 'a1', 'a2']);
    });
  });

  // ── Cross-column move ──────────────────────────────────────────────

  describe('cross-column move', () => {
    it('should call onMove when item is dropped in a different column', () => {
      board = createBoard({ A: ['a1', 'a2'], B: ['b1'] });
      const ref = { current: board };

      const { result, onReorder, onMove } = renderKanban({ A: ['a1', 'a2'], B: ['b1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B above b1 midpoint. clientY=10.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 10 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(onMove).toHaveBeenCalledWith('a1', 'A', 'B', ['a1', 'b1'], ['a2']);
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should move item to an empty column', () => {
      board = createBoard({ A: ['a1'], B: [] });
      const ref = { current: board };

      const { result, onMove } = renderKanban({ A: ['a1'], B: [] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B (empty). clientY=50 is within column bounds.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(onMove).toHaveBeenCalledWith('a1', 'A', 'B', ['a1'], []);
    });

    it('should insert at correct index within target column', () => {
      board = createBoard({ A: ['a1'], B: ['b1', 'b2'] });
      const ref = { current: board };

      const { result, onMove } = renderKanban({ A: ['a1'], B: ['b1', 'b2'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B below b1 midpoint (mid=30) but above b2 midpoint (mid=90).
      // clientY=50 → computeDropIndex: 50 > b1 mid (30) → newIndex=1, 50 < b2 mid (90) → break at i=1.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(onMove).toHaveBeenCalledWith('a1', 'A', 'B', ['b1', 'a1', 'b2'], []);
    });
  });

  // ── Drop outside columns ──────────────────────────────────────────

  describe('drop outside columns', () => {
    it('should reset state without calling callbacks when dropped outside all columns', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      const { result, onReorder, onMove } = renderKanban({ A: ['a1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move far outside all columns (beyond padding tolerance).
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 9999, clientY: 9999 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(onReorder).not.toHaveBeenCalled();
      expect(onMove).not.toHaveBeenCalled();
      expect(result.current.draggedId).toBeNull();
      expect(result.current.ghostPosition).toBeNull();
    });
  });

  // ── Cleanup and cancellation ───────────────────────────────────────

  describe('cleanup and cancellation', () => {
    it('should reset drag state on pointerup', () => {
      board = createBoard({ A: ['a1', 'a2'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1', 'a2'] }, ref);

      startDrag(result, 'a1', 100, 10);

      expect(result.current.draggedId).toBe('a1');

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(result.current.draggedId).toBeNull();
      expect(result.current.draggedFromColumn).toBeNull();
      expect(result.current.hoveredColumn).toBeNull();
      expect(result.current.placeholderIndex).toBeNull();
      expect(result.current.ghostPosition).toBeNull();
      expect(result.current.ghostWidth).toBe(0);
    });

    it('should reset drag state on pointercancel', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      const { result } = renderKanban({ A: ['a1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      act(() => {
        window.dispatchEvent(new PointerEvent('pointercancel'));
      });

      expect(result.current.draggedId).toBeNull();
    });

    it('should cancel requestAnimationFrame on cleanup', () => {
      board = createBoard({ A: ['a1'] });
      const ref = { current: board };

      // Override RAF to NOT immediately call the callback (simulates pending RAF).
      const rafMock = vi.fn().mockReturnValue(42);

      vi.stubGlobal('requestAnimationFrame', rafMock);

      const { result } = renderKanban({ A: ['a1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Trigger pointermove to schedule a RAF.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 110, clientY: 20 }));
      });

      // Drop — should cancel the pending RAF.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle columns with single items', () => {
      board = createBoard({ A: ['a1'], B: ['b1'] });
      const ref = { current: board };

      const { result, onMove } = renderKanban({ A: ['a1'], B: ['b1'] }, ref);

      startDrag(result, 'a1', 100, 10);

      // Move into column B.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 10 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(onMove).toHaveBeenCalledWith('a1', 'A', 'B', ['a1', 'b1'], []);
    });

    it('should reflect updated columns prop', () => {
      board = createBoard({ A: ['a1', 'a2'], B: [] });
      const ref = { current: board };

      const { result, rerender, onMove } = renderKanban({ A: ['a1', 'a2'], B: [] }, ref);

      // Simulate an optimistic update: a1 moved to B before a new drag.
      rerender({ columns: { A: ['a2'], B: ['a1'] }, columnIds: ['A', 'B'] });

      // Now drag a2 from the updated column A.
      startDrag(result, 'a2', 100, 10);

      // Move into column B.
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }));
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      // The hook should use the updated columns: source A=['a2'], target B=['a1'].
      expect(onMove).toHaveBeenCalledWith('a2', 'A', 'B', expect.arrayContaining(['a1', 'a2']), []);
    });
  });
});
