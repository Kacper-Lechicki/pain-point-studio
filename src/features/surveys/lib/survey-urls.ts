import { ROUTES } from '@/config/routes';

/** Build the dashboard URL to edit a draft survey. */
export function getSurveyEditUrl(id: string) {
  return `${ROUTES.dashboard.surveysNew}/${id}`;
}

/** Build the dashboard URL to edit a draft survey with publish settings open. */
export function getSurveyPublishUrl(id: string) {
  return `${ROUTES.dashboard.surveysNew}/${id}?publish=true`;
}

/** Build the dashboard URL to view survey stats/results. */
export function getSurveyStatsUrl(id: string) {
  return `${ROUTES.dashboard.surveysStats}/${id}`;
}

/** Build the dashboard URL for a survey detail page. */
export function getSurveyDetailUrl(id: string) {
  return `${ROUTES.dashboard.surveys}/${id}`;
}
