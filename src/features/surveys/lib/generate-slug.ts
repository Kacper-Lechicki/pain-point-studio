import { nanoid } from 'nanoid';

const SLUG_LENGTH = 10;

export function generateSurveySlug(): string {
  return nanoid(SLUG_LENGTH);
}

export function slugifyTitle(title: string, maxLength = 30): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, maxLength);
}
