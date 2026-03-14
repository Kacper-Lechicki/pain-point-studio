// @vitest-environment jsdom
import { useEffect } from 'react';

import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useElementSize } from './use-element-size';

let observerCallback: ResizeObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: ResizeObserverCallback) {
        observerCallback = cb;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// Capture hook output via a component that attaches the ref to a real DOM element
let capturedSize = { width: 0, height: 0 };

function TestComponent() {
  const [ref, size] = useElementSize<HTMLDivElement>();

  useEffect(() => {
    capturedSize = size;
  }, [size]);

  return <div ref={ref} data-testid="target" />;
}

describe('useElementSize', () => {
  it('returns initial size of { width: 0, height: 0 }', () => {
    render(<TestComponent />);

    expect(capturedSize).toEqual({ width: 0, height: 0 });
  });

  it('creates a ResizeObserver and observes the element', () => {
    render(<TestComponent />);

    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it('updates size from ResizeObserver callback', () => {
    render(<TestComponent />);

    act(() => {
      observerCallback(
        [{ contentRect: { width: 300, height: 150 } } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    expect(capturedSize).toEqual({ width: 300, height: 150 });
  });

  it('does not update state when size is unchanged (memoization)', () => {
    render(<TestComponent />);

    act(() => {
      observerCallback(
        [{ contentRect: { width: 100, height: 50 } } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    const sizeAfterFirst = capturedSize;

    act(() => {
      observerCallback(
        [{ contentRect: { width: 100, height: 50 } } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    // Same object reference — state setter returned prev
    expect(capturedSize).toBe(sizeAfterFirst);
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<TestComponent />);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('updates to new size after multiple resize events', () => {
    render(<TestComponent />);

    act(() => {
      observerCallback(
        [{ contentRect: { width: 100, height: 50 } } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    expect(capturedSize).toEqual({ width: 100, height: 50 });

    act(() => {
      observerCallback(
        [{ contentRect: { width: 200, height: 100 } } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    expect(capturedSize).toEqual({ width: 200, height: 100 });
  });
});
