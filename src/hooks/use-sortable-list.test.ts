import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSortableList } from './use-sortable-list';

const ATTR = 'data-item-id';

function createContainer(ids: string[], itemHeight = 50): HTMLDivElement {
  const container = document.createElement('div');

  ids.forEach((id, i) => {
    const el = document.createElement('div');

    el.setAttribute(ATTR, id);
    // Mock getBoundingClientRect for each element.
    el.getBoundingClientRect = () => ({
      top: i * itemHeight,
      bottom: (i + 1) * itemHeight,
      left: 0,
      right: 200,
      width: 200,
      height: itemHeight,
      x: 0,
      y: i * itemHeight,
      toJSON: () => {},
    });
    container.appendChild(el);
  });

  document.body.appendChild(container);

  return container;
}

describe('useSortableList', () => {
  let container: HTMLDivElement;
  const onReorder = vi.fn();

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
    if (container?.parentNode) {
      document.body.removeChild(container);
    }

    vi.restoreAllMocks();
  });

  // Initial state: nothing is being dragged.
  it('should start with no drag state', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    expect(result.current.draggedId).toBeNull();
    expect(result.current.placeholderIndex).toBeNull();
    expect(result.current.ghostPosition).toBeNull();
    expect(result.current.ghostWidth).toBe(0);
    expect(result.current.draggedFromIndex).toBe(-1);
    expect(result.current.showPlaceholderAtEnd).toBe(false);
  });

  // isDragging returns false for all items when not dragging.
  it('should return false for isDragging when idle', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    expect(result.current.isDragging('a')).toBe(false);
    expect(result.current.isDragging('b')).toBe(false);
    expect(result.current.isDragging('c')).toBe(false);
  });

  // handleDragStart sets draggedId and related state.
  it('should set drag state on handleDragStart', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    act(() => {
      result.current.handleDragStart(
        {
          clientX: 100,
          clientY: 10,
          stopPropagation: vi.fn(),
        } as unknown as React.PointerEvent,
        'b'
      );
    });

    expect(result.current.draggedId).toBe('b');
    expect(result.current.isDragging('b')).toBe(true);
    expect(result.current.isDragging('a')).toBe(false);
    expect(result.current.placeholderIndex).toBe(1);
    expect(result.current.draggedFromIndex).toBe(1);
    expect(result.current.ghostPosition).not.toBeNull();
    expect(result.current.ghostWidth).toBe(200);
  });

  // showPlaceholderAt returns false at the dragged item's own index.
  it('should not show placeholder at the dragged items own index', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    act(() => {
      result.current.handleDragStart(
        {
          clientX: 100,
          clientY: 10,
          stopPropagation: vi.fn(),
        } as unknown as React.PointerEvent,
        'b'
      );
    });

    expect(result.current.showPlaceholderAt(1)).toBe(false);
  });

  // pointerup resets all drag state back to idle.
  it('should reset drag state on pointerup', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    act(() => {
      result.current.handleDragStart(
        {
          clientX: 100,
          clientY: 10,
          stopPropagation: vi.fn(),
        } as unknown as React.PointerEvent,
        'a'
      );
    });

    expect(result.current.draggedId).toBe('a');

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    expect(result.current.draggedId).toBeNull();
    expect(result.current.placeholderIndex).toBeNull();
    expect(result.current.ghostPosition).toBeNull();
    expect(result.current.ghostWidth).toBe(0);
  });

  // pointercancel also resets drag state (e.g. touch interrupted).
  it('should reset drag state on pointercancel', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    act(() => {
      result.current.handleDragStart(
        {
          clientX: 100,
          clientY: 10,
          stopPropagation: vi.fn(),
        } as unknown as React.PointerEvent,
        'a'
      );
    });

    act(() => {
      window.dispatchEvent(new PointerEvent('pointercancel'));
    });

    expect(result.current.draggedId).toBeNull();
  });

  // Dropping at the same position should not call onReorder.
  it('should not call onReorder when dropped at same position', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    act(() => {
      result.current.handleDragStart(
        {
          clientX: 100,
          clientY: 10,
          stopPropagation: vi.fn(),
        } as unknown as React.PointerEvent,
        'a'
      );
    });

    // Drop immediately without moving — placeholder stays at fromIndex.
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  // Dragging first item down past the second should reorder.
  it('should call onReorder when item is moved to a new position', () => {
    container = createContainer(['a', 'b', 'c']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b', 'c'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    // Start dragging 'a' (index 0).
    act(() => {
      result.current.handleDragStart(
        {
          clientX: 100,
          clientY: 10,
          stopPropagation: vi.fn(),
        } as unknown as React.PointerEvent,
        'a'
      );
    });

    // Move pointer below 'b' midpoint (75px = past mid of item at y=50..100).
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 80 }));
    });

    // Drop.
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  // handleDragStart calls stopPropagation on the event.
  it('should call stopPropagation on drag start', () => {
    container = createContainer(['a', 'b']);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: ['a', 'b'],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    const stopPropagation = vi.fn();

    act(() => {
      result.current.handleDragStart(
        { clientX: 0, clientY: 0, stopPropagation } as unknown as React.PointerEvent,
        'a'
      );
    });

    expect(stopPropagation).toHaveBeenCalled();
  });

  // Empty list should not break.
  it('should handle empty item list', () => {
    container = createContainer([]);
    const ref = { current: container };

    const { result } = renderHook(() =>
      useSortableList({
        itemIds: [],
        containerRef: ref,
        itemIdAttribute: ATTR,
        onReorder,
      })
    );

    expect(result.current.draggedId).toBeNull();
    expect(result.current.showPlaceholderAtEnd).toBe(false);
  });
});
