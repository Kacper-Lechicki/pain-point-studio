import { ROUTES } from '@/config/routes';

export function getCreateSurveyUrl(projectId: string) {
  return `${ROUTES.dashboard.projects}/${projectId}/new-survey`;
}

export function getSurveyEditUrl(id: string) {
  return `${ROUTES.dashboard.researchNew}/${id}`;
}

export function getSurveyPublishUrl(id: string) {
  return `${ROUTES.dashboard.researchNew}/${id}?publish=true`;
}

export function getSurveyStatsUrl(id: string) {
  return `${ROUTES.dashboard.researchStats}/${id}`;
}

export function getSurveyDetailUrl(id: string) {
  return `${ROUTES.dashboard.researchStats}/${id}`;
}
