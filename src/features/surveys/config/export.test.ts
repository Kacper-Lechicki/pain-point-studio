/** Tests for survey export format configuration. */
import { describe, expect, it } from 'vitest';

import { EXPORT_FORMATS } from './export';

describe('EXPORT_FORMATS', () => {
  it('should define csv and json formats', () => {
    expect(EXPORT_FORMATS).toHaveProperty('csv');
    expect(EXPORT_FORMATS).toHaveProperty('json');
  });

  it('should map csv to text/csv MIME type', () => {
    expect(EXPORT_FORMATS.csv.mime).toBe('text/csv');
    expect(EXPORT_FORMATS.csv.field).toBe('csv');
  });

  it('should map json to application/json MIME type', () => {
    expect(EXPORT_FORMATS.json.mime).toBe('application/json');
    expect(EXPORT_FORMATS.json.field).toBe('json');
  });

  it('should have matching field and format keys', () => {
    for (const [key, value] of Object.entries(EXPORT_FORMATS)) {
      expect(value.field).toBe(key);
    }
  });
});
