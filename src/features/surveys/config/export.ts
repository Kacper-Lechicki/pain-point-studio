export type ExportFormat = 'csv' | 'json';

export const EXPORT_FORMATS = {
  csv: { field: 'csv', mime: 'text/csv' },
  json: { field: 'json', mime: 'application/json' },
} as const;
