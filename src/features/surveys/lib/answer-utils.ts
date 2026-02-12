/**
 * Checks whether a survey answer value is considered empty / unanswered.
 * Works for all question types by inspecting the discriminating keys.
 */
export function isAnswerEmpty(value: Record<string, unknown>): boolean {
  if ('text' in value) {
    return !(value.text as string)?.trim();
  }

  if ('selected' in value) {
    return ((value.selected as string[]) ?? []).length === 0;
  }

  if ('rating' in value) {
    return value.rating === null || value.rating === undefined;
  }

  if ('answer' in value) {
    return value.answer === null || value.answer === undefined;
  }

  return true;
}
