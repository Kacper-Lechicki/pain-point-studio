/**
 * Browser-side provider factories.
 *
 * Feature code imports these instead of directly referencing
 * the Supabase implementations. Swapping to a different backend
 * only requires changing the imports in this file.
 */
export { createBrowserAuthProvider } from '@/lib/supabase/providers/auth.client';
export { createBrowserStorageProvider } from '@/lib/supabase/providers/storage.client';
export { createBrowserRealtimeProvider } from '@/lib/supabase/providers/realtime';
