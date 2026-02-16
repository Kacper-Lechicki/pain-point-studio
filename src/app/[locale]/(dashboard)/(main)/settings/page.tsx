import { redirect } from 'next/navigation';

import { ROUTES } from '@/config';

export default function SettingsIndexRoute() {
  redirect(ROUTES.settings.profile);
}
