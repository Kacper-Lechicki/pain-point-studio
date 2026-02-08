/**
 * Re-exports mapSupabaseError as mapAuthError for backward compatibility.
 * The canonical implementation lives in @/lib/supabase/errors.
 */
export { mapSupabaseError as mapAuthError } from '@/lib/supabase/errors';
