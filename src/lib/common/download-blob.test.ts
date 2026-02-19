/** Tests for the downloadBlob browser file-download utility. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from './download-blob';

describe('downloadBlob', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createdAnchor: HTMLAnchorElement;

  const fakeUrl = 'blob:http://localhost/fake-object-url';

  beforeEach(() => {
    clickSpy = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation(() => {
      createdAnchor = { click: clickSpy } as unknown as HTMLAnchorElement;

      return createdAnchor;
    });

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a Blob with the given content and MIME type', () => {
    downloadBlob('hello', 'test.txt', 'text/plain');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]![0] as Blob;
    expect(blob.type).toBe('text/plain');
  });

  it('sets href and download on the anchor element', () => {
    downloadBlob('data', 'export.csv', 'text/csv');

    expect(createdAnchor.href).toBe(fakeUrl);
    expect(createdAnchor.download).toBe('export.csv');
  });

  it('appends the anchor, clicks it, then removes it', () => {
    downloadBlob('data', 'file.json', 'application/json');

    expect(appendChildSpy).toHaveBeenCalledWith(createdAnchor);
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(removeChildSpy).toHaveBeenCalledWith(createdAnchor);
  });

  it('revokes the object URL after download', () => {
    downloadBlob('data', 'file.txt', 'text/plain');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
  });

  it('executes steps in correct order: create → append → click → remove → revoke', () => {
    const callOrder: string[] = [];

    vi.mocked(document.body.appendChild).mockImplementation((node) => {
      callOrder.push('appendChild');

      return node;
    });
    clickSpy.mockImplementation(() => callOrder.push('click'));
    vi.mocked(document.body.removeChild).mockImplementation((node) => {
      callOrder.push('removeChild');

      return node;
    });
    vi.mocked(URL.revokeObjectURL).mockImplementation(() => callOrder.push('revokeObjectURL'));

    downloadBlob('data', 'file.txt', 'text/plain');

    expect(callOrder).toEqual(['appendChild', 'click', 'removeChild', 'revokeObjectURL']);
  });
});
