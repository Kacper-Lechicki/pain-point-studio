import { describe, expect, it } from 'vitest';

import { mapRpcError } from './error-codes';

describe('mapRpcError', () => {
  it('maps SURVEY_NOT_FOUND to closed.completed', () => {
    expect(mapRpcError('SURVEY_NOT_FOUND')).toBe('closed.completed');
  });

  it('maps SURVEY_NOT_ACTIVE to closed.completed', () => {
    expect(mapRpcError('SURVEY_NOT_ACTIVE')).toBe('closed.completed');
  });

  it('maps MAX_RESPONDENTS_REACHED to closed.maxReached', () => {
    expect(mapRpcError('MAX_RESPONDENTS_REACHED')).toBe('closed.maxReached');
  });

  it('maps RESPONSE_NOT_FOUND to errors.startFailed', () => {
    expect(mapRpcError('RESPONSE_NOT_FOUND')).toBe('errors.startFailed');
  });

  it('maps RESPONSE_ALREADY_COMPLETED to errors.submitFailed', () => {
    expect(mapRpcError('RESPONSE_ALREADY_COMPLETED')).toBe('errors.submitFailed');
  });

  it('returns default fallback for unknown error', () => {
    expect(mapRpcError('UNKNOWN_ERROR')).toBe('errors.saveFailed');
  });

  it('returns custom fallback when provided', () => {
    expect(mapRpcError('UNKNOWN_ERROR', 'custom.fallback')).toBe('custom.fallback');
  });

  it('extracts code from longer error message', () => {
    expect(mapRpcError('RPC error: SURVEY_NOT_FOUND in function')).toBe('closed.completed');
  });
});
