import { nanoid } from 'nanoid';

const SLUG_LENGTH = 10;

export function generateSurveySlug(): string {
  return nanoid(SLUG_LENGTH);
}
