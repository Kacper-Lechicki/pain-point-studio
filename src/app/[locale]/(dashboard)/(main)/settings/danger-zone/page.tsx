import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { DangerZone } from '@/features/settings/components/danger-zone';
import { createServerDatabase } from '@/lib/providers/server';

export default async function SettingsDangerZonePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  const db = await createServerDatabase();

  const [{ count: activeSurveyCount }, { count: responseCount }] = await Promise.all([
    db.surveys.countByUserId(profile.id, { status: 'active' }),
    db.surveyResponses.countByUserSurveys(profile.id, { status: 'completed' }),
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
