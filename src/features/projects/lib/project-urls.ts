import { ROUTES } from '@/config/routes';

export function getProjectDetailUrl(id: string) {
  return `${ROUTES.dashboard.projects}/${id}`;
}
