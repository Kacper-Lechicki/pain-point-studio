/** getAppMetadata: translatable SEO metadata generation. */
import { describe, expect, it, vi } from 'vitest';

import { BRAND } from '@/config/brand';

import { getAppMetadata } from './metadata';

type Translator = Parameters<typeof getAppMetadata>[0];

function makeT(): Translator & { raw: ReturnType<typeof vi.fn> } {
  const raw = vi.fn((): unknown => []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock translator ignores key
  const t = vi.fn((_key: string) => 'mock') as unknown as Translator & {
    raw: ReturnType<typeof vi.fn>;
  };
  t.raw = raw;

  return t;
}

// ── getAppMetadata ───────────────────────────────────────────────────

describe('getAppMetadata', () => {
  it('should return object with title, description, keywords, authors, creator, publisher', () => {
    const t = makeT();
    t.raw.mockReturnValue(['keyword1', 'keyword2']);

    const result = getAppMetadata(t as Translator);

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('authors');
    expect(result).toHaveProperty('creator');
    expect(result).toHaveProperty('publisher');
  });

  it('should call t with BRAND.name for title', () => {
    const t = makeT();

    getAppMetadata(t as Translator);

    expect(t).toHaveBeenCalledWith(BRAND.name);
  });

  it('should call t with metadata.description for description', () => {
    const t = makeT();

    getAppMetadata(t as Translator);

    expect(t).toHaveBeenCalledWith('metadata.description');
  });

  it('should call t.raw with metadata.keywords for keywords', () => {
    const t = makeT();
    t.raw.mockReturnValue(['a', 'b']);

    getAppMetadata(t as Translator);

    expect(t.raw).toHaveBeenCalledWith('metadata.keywords');
  });

  it('should call t with BRAND.author for authors, creator, publisher', () => {
    const t = makeT();

    getAppMetadata(t as Translator);

    expect(t).toHaveBeenCalledWith(BRAND.author);
  });

  it('should set authors as array with single object containing name from t(BRAND.author)', () => {
    const t = makeT();
    (
      t as unknown as { mockImplementation: (fn: (key: string) => string) => void }
    ).mockImplementation((key: string) => (key === BRAND.author ? 'Test Author' : ''));

    const result = getAppMetadata(t as Translator);

    expect(result.authors).toEqual([{ name: 'Test Author' }]);
    expect(result.creator).toBe('Test Author');
    expect(result.publisher).toBe('Test Author');
  });
});
