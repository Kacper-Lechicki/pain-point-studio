import { redirect } from 'next/navigation';

import { ROUTES } from '@/config';

export default function AnalyticsIndexRoute() {
  redirect(ROUTES.dashboard.analyticsProjectIdea);
}
