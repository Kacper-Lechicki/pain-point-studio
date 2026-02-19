/**
 * Supabase implementation of the StorageProvider interface for server-side usage.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { StorageProvider } from '@/lib/providers/storage';

import type { Database } from '../types';

export function createServerStorageProvider(supabase: SupabaseClient<Database>): StorageProvider {
  return {
    async upload(bucket, path, file, options) {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        ...(options?.upsert !== undefined ? { upsert: options.upsert } : {}),
        ...(options?.contentType !== undefined ? { contentType: options.contentType } : {}),
      });

      return { error: error ? { message: error.message } : null };
    },

    async remove(bucket, paths) {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      return { error: error ? { message: error.message } : null };
    },

    async list(bucket, prefix) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix);

      return {
        data: data?.map((f) => ({ name: f.name })) ?? null,
        error: error ? { message: error.message } : null,
      };
    },

    getPublicUrl(bucket, path) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      return data.publicUrl;
    },
  };
}
