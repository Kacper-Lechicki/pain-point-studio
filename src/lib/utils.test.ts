import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('CN Utility', () => {
  // Test basic merging of multiple class strings
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  // Test if the utility correctly ignores falsy values from conditional logic
  it('should handle conditional classes', () => {
    const condition = true;
    const result = cn('text-red-500', condition && 'bg-blue-500');

    expect(result).toBe('text-red-500 bg-blue-500');
  });

  // Test Tailwind-specific conflict resolution (e.g., p-4 vs p-2)
  it('should merge tailwind classes properly', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });
});
