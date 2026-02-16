import { ROUTES } from '@/config/routes';

export function getSurveyEditUrl(id: string) {
  return `${ROUTES.dashboard.surveysNew}/${id}`;
}

export function getSurveyPublishUrl(id: string) {
  return `${ROUTES.dashboard.surveysNew}/${id}?publish=true`;
}

export function getSurveyStatsUrl(id: string) {
  return `${ROUTES.dashboard.surveysStats}/${id}`;
}

export function getSurveyDetailUrl(id: string) {
  return `${ROUTES.dashboard.surveys}/${id}`;
}
