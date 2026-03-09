import { getAdminClient } from './supabase-admin';
import { ensureUser } from './supabase-admin';

export async function addOAuthIdentity(
  userId: string,
  provider: 'github' | 'google',
  email: string
): Promise<string> {
  const admin = getAdminClient();
  const identityId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await admin.rpc('add_fake_oauth_identity', {
    p_user_id: userId,
    p_identity_id: identityId,
    p_provider: provider,
    p_email: email,
    p_created_at: now,
  });

  if (error) {
    throw new Error(`[e2e] Failed to add ${provider} identity to ${userId}: ${error.message}`);
  }

  return identityId;
}

export async function ensureUserWithOAuthIdentity(
  email: string,
  password: string,
  oauthProvider: 'github' | 'google'
): Promise<{ userId: string; identityId: string }> {
  const userId = await ensureUser(email, password);
  const identityId = await addOAuthIdentity(userId, oauthProvider, email);

  return { userId, identityId };
}
