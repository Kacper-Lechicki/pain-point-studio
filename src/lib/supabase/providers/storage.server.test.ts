/** Tests for the Supabase server StorageProvider implementation. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from '../types';
import { createServerStorageProvider } from './storage.server';

// ── Helpers ──────────────────────────────────────────────────────

function createMockSupabase() {
  const mockUpload = vi.fn();
  const mockRemove = vi.fn();
  const mockList = vi.fn();
  const mockGetPublicUrl = vi.fn();

  return {
    supabase: {
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
          remove: mockRemove,
          list: mockList,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    } as unknown as SupabaseClient<Database>,
    mocks: { mockUpload, mockRemove, mockList, mockGetPublicUrl },
  };
}

describe('createServerStorageProvider', () => {
  let supabase: SupabaseClient<Database>;
  let mocks: ReturnType<typeof createMockSupabase>['mocks'];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockSupabase();
    supabase = mock.supabase;
    mocks = mock.mocks;
  });

  // ── upload ─────────────────────────────────────────────────────

  describe('upload', () => {
    it('should call storage.from(bucket).upload and return null error on success', async () => {
      mocks.mockUpload.mockResolvedValue({ error: null });

      const provider = createServerStorageProvider(supabase);
      const file = new File(['content'], 'test.txt');
      const result = await provider.upload('avatars', 'path/file.txt', file);

      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(mocks.mockUpload).toHaveBeenCalledWith('path/file.txt', file, {});
      expect(result).toEqual({ error: null });
    });

    it('should pass upsert and contentType options', async () => {
      mocks.mockUpload.mockResolvedValue({ error: null });

      const provider = createServerStorageProvider(supabase);
      const file = new File(['content'], 'img.png');
      await provider.upload('avatars', 'path/img.png', file, {
        upsert: true,
        contentType: 'image/png',
      });

      expect(mocks.mockUpload).toHaveBeenCalledWith('path/img.png', file, {
        upsert: true,
        contentType: 'image/png',
      });
    });

    it('should map error when upload fails', async () => {
      mocks.mockUpload.mockResolvedValue({
        error: { message: 'Bucket not found' },
      });

      const provider = createServerStorageProvider(supabase);
      const file = new File(['content'], 'test.txt');
      const result = await provider.upload('missing', 'path/file.txt', file);

      expect(result).toEqual({ error: { message: 'Bucket not found' } });
    });
  });

  // ── remove ─────────────────────────────────────────────────────

  describe('remove', () => {
    it('should call storage.from(bucket).remove with paths', async () => {
      mocks.mockRemove.mockResolvedValue({ error: null });

      const provider = createServerStorageProvider(supabase);
      const result = await provider.remove('avatars', ['path/a.txt', 'path/b.txt']);

      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(mocks.mockRemove).toHaveBeenCalledWith(['path/a.txt', 'path/b.txt']);
      expect(result).toEqual({ error: null });
    });

    it('should map error when remove fails', async () => {
      mocks.mockRemove.mockResolvedValue({
        error: { message: 'Permission denied' },
      });

      const provider = createServerStorageProvider(supabase);
      const result = await provider.remove('avatars', ['path/file.txt']);

      expect(result).toEqual({ error: { message: 'Permission denied' } });
    });
  });

  // ── list ───────────────────────────────────────────────────────

  describe('list', () => {
    it('should return mapped file names', async () => {
      mocks.mockList.mockResolvedValue({
        data: [{ name: 'a.txt' }, { name: 'b.txt' }],
        error: null,
      });

      const provider = createServerStorageProvider(supabase);
      const result = await provider.list('avatars', 'user-123');

      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(mocks.mockList).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        data: [{ name: 'a.txt' }, { name: 'b.txt' }],
        error: null,
      });
    });

    it('should return null data when list returns null', async () => {
      mocks.mockList.mockResolvedValue({ data: null, error: null });

      const provider = createServerStorageProvider(supabase);
      const result = await provider.list('avatars', 'empty');

      expect(result).toEqual({ data: null, error: null });
    });
  });

  // ── getPublicUrl ───────────────────────────────────────────────

  describe('getPublicUrl', () => {
    it('should return the public URL string', () => {
      mocks.mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://cdn.example.com/avatars/photo.jpg' },
      });

      const provider = createServerStorageProvider(supabase);
      const url = provider.getPublicUrl('avatars', 'photo.jpg');

      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(mocks.mockGetPublicUrl).toHaveBeenCalledWith('photo.jpg');
      expect(url).toBe('https://cdn.example.com/avatars/photo.jpg');
    });
  });
});
