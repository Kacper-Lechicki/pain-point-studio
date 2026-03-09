import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import { env } from './env';

let _admin: SupabaseClient | null = null;

export function getAdminClient() {
  if (_admin) {
    return _admin;
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[e2e] SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
  }

  _admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _admin;
}

export async function ensureUser(
  email: string,
  password: string,
  profile?: { fullName?: string; role?: string }
): Promise<string> {
  const admin = getAdminClient();

  for (let attempt = 0; attempt < 3; attempt++) {
    await deleteUserByEmail(email).catch(() => {});

    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!error) {
      const fullName = profile?.fullName ?? 'E2E User';
      const role = profile?.role === '' ? null : (profile?.role ?? 'other');

      const { error: profileError } = await admin
        .from('profiles')
        .update({ full_name: fullName, role })
        .eq('id', data.user.id);

      if (profileError) {
        throw new Error(
          `[e2e] User ${email} created but profile update failed: ${profileError.message}`
        );
      }

      return data.user.id;
    }

    if (attempt === 2) {
      throw new Error(`[e2e] Failed to create user ${email}: ${error.message}`);
    }
  }

  throw new Error('[e2e] ensureUser: unexpected code path');
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const admin = getAdminClient();

  let page = 1;

  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 50 });
    const users = data?.users ?? [];
    const user = users.find((u) => u.email === email);

    if (user) {
      await admin.auth.admin.deleteUser(user.id);

      return;
    }

    if (users.length < 50) {
      break;
    }

    page++;
  }

  const { data: userId } = await admin.rpc('get_user_id_by_email', {
    lookup_email: email,
  });

  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
