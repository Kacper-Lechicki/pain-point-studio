/**
 * Provider-agnostic file storage interface. Implemented by Supabase Storage
 * (or any future S3-compatible / custom storage provider).
 */

export interface StorageFile {
  name: string;
}

export interface StorageError {
  message: string;
}

export interface StorageProvider {
  upload(
    bucket: string,
    path: string,
    file: Blob,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ error: StorageError | null }>;

  remove(bucket: string, paths: string[]): Promise<{ error: StorageError | null }>;

  list(
    bucket: string,
    prefix: string
  ): Promise<{ data: StorageFile[] | null; error: StorageError | null }>;

  getPublicUrl(bucket: string, path: string): string;
}
