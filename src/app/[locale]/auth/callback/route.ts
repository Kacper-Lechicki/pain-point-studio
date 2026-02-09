import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createClient } from '@/lib/supabase/server';

/**
 * Validates that a redirect path is safe (relative, no open redirect).
 */
function getSafeRedirectPath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }

  return next;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Restore custom avatar: OAuth sign-in overwrites user_metadata.avatar_url
      // with the provider's avatar. If the user set a custom one (stored in
      // profiles.avatar_url), sync it back to user_metadata.
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single();

        if (profile?.avatar_url && profile.avatar_url !== data.user.user_metadata?.avatar_url) {
          await supabase.auth.updateUser({
            data: { avatar_url: profile.avatar_url },
          });
        }
      }

      const fallbackPath = `/${locale}${ROUTES.common.dashboard}`;
      const redirectPath = getSafeRedirectPath(next, fallbackPath);

      const redirectUrl = new URL(redirectPath, request.url);

      // Add toast param for dashboard redirects (email confirmation or OAuth sign-in)
      if (redirectPath === fallbackPath) {
        const toastKey = type === 'signup' ? 'emailConfirmed' : 'signInSuccess';

        redirectUrl.searchParams.set('toast', toastKey);
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

  signInUrl.searchParams.set('error', 'auth_callback_error');

  return NextResponse.redirect(signInUrl);
}
