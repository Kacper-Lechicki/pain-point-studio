/** Values that are always sorted to the end of the list, regardless of locale. */
const PINNED_TAIL_VALUES = new Set(['other']);

/**
 * Sort `{ value, label }` option arrays alphabetically by `label`,
 * pinning special entries (e.g. "other") to the end.
 *
 * Returns a **new** array - the original is not mutated.
 */
export function sortOptionsAlphabetically<T extends { value: string; label: string }>(
  options: readonly T[]
): T[] {
  return [...options].sort((a, b) => {
    const aTail = PINNED_TAIL_VALUES.has(a.value);
    const bTail = PINNED_TAIL_VALUES.has(b.value);

    if (aTail !== bTail) {
      return aTail ? 1 : -1;
    }

    return a.label.localeCompare(b.label);
  });
}
