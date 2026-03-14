// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cropImage } from './crop-image';

const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

const mockDrawImage = vi.fn();

let mockToBlobResult: Blob | null = mockBlob;

const mockGetContext = vi.fn(() => ({
  drawImage: mockDrawImage,
}));

const CROP_AREA = { x: 10, y: 10, width: 200, height: 200 };

beforeEach(() => {
  mockToBlobResult = mockBlob;

  vi.spyOn(document, 'createElement').mockImplementation(
    () =>
      ({
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
          cb(mockToBlobResult);
        }),
      }) as unknown as HTMLCanvasElement
  );

  vi.stubGlobal(
    'Image',
    class MockImage {
      crossOrigin = '';
      src = '';
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;

      constructor() {
        setTimeout(() => this.onload?.(), 0);
      }
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── cropImage ───────────────────────────────────────────────────────

describe('cropImage', () => {
  it('returns a blob on successful crop', async () => {
    const result = await cropImage('data:image/png;base64,test', CROP_AREA);

    expect(result).toBe(mockBlob);
    expect(mockDrawImage).toHaveBeenCalled();
  });

  it('throws when canvas context is null', async () => {
    mockGetContext.mockReturnValueOnce(null as unknown as ReturnType<typeof mockGetContext>);

    await expect(cropImage('data:image/png;base64,test', CROP_AREA)).rejects.toThrow(
      'Canvas context not available'
    );
  });

  it('throws when toBlob returns null', async () => {
    mockToBlobResult = null;

    await expect(cropImage('data:image/png;base64,test', CROP_AREA)).rejects.toThrow(
      'Canvas toBlob failed'
    );
  });
});
