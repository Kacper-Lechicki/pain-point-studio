'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/**
 * Pin or unpin a project on the dashboard.
 * Pass `null` to unpin the currently pinned project.
 */
export async function setPinnedProject(projectId: string | null): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ pinned_project_id: projectId })
    .eq('id', user.id);

  if (error) {
    return { success: false };
  }

  revalidatePath('/dashboard');

  return { success: true };
}
