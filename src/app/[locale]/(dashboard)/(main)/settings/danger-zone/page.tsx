import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { DangerZone } from '@/features/settings/components/danger-zone';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsDangerZonePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  const supabase = await createClient();

  const [{ count: activeSurveyCount }, { count: responseCount }] = await Promise.all([
    supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'active'),
    supabase
      .from('survey_responses')
      .select('*, surveys!inner(*)', { count: 'exact', head: true })
      .eq('surveys.user_id', profile.id)
      .eq('status', 'completed'),
  ]);

  return (
    <PageTransition>
      <DangerZone
        userEmail={profile.email}
        activeSurveyCount={activeSurveyCount ?? 0}
        responseCount={responseCount ?? 0}
      />
    </PageTransition>
  );
}
