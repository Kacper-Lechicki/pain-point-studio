/**
 * Supabase implementation of the SessionMiddleware interface.
 * Wraps the existing updateSession function and maps User → AppUser.
 */
import type { SessionMiddleware } from '@/lib/providers/middleware';

import { updateSession as supabaseUpdateSession } from '../middleware';
import { mapSupabaseUser } from './user-mapper';

export function createSupabaseSessionMiddleware(): SessionMiddleware {
  return {
    async updateSession(req) {
      const { response, user } = await supabaseUpdateSession(req);

      return {
        response,
        user: user ? mapSupabaseUser(user) : null,
      };
    },
  };
}
