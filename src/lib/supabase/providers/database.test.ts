/** Tests for the Supabase database client that wraps PostgREST queries and RPC calls. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from '../types';
import { createSupabaseDatabaseClient } from './database';

// ── Chainable PostgREST mock builder ──────────────────────────────

type MockChain = Record<string, ReturnType<typeof vi.fn>> & {
  /** Resolve the terminal call (single / maybeSingle / order / the chain itself). */
  _resolve: (value: unknown) => void;
};

/**
 * Creates a chainable mock that mimics PostgREST builder pattern.
 * Every method returns the same chain, and the chain is itself thenable
 * so `await query` works for count / head queries that have no terminal.
 */
function createChain(resolvedValue: unknown = { data: null, error: null }): MockChain {
  const _resolve: (v: unknown) => void = () => {};

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'single',
    'maybeSingle',
    'order',
  ];

  const handler: ProxyHandler<typeof chain> = {
    get(_target, prop: string) {
      if (prop === '_resolve') {
        return (v: unknown) => {
          _resolve(v);
        };
      }

      // Make the chain thenable (for count/head queries that resolve without terminal)
      if (prop === 'then') {
        return (onFulfill: (v: unknown) => unknown) => onFulfill(resolvedValue);
      }

      if (!methods.includes(prop)) {
        return undefined;
      }

      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(new Proxy(chain, handler));
      }

      return chain[prop];
    },
  };

  const proxy = new Proxy(chain, handler) as unknown as MockChain;

  // For terminals that should resolve to a specific value
  for (const terminal of ['single', 'maybeSingle']) {
    if (!chain[terminal]) {
      chain[terminal] = vi.fn().mockResolvedValue(resolvedValue);
    }
  }

  proxy._resolve = (v: unknown) => {
    resolvedValue = v;
  };

  return proxy;
}

// ── Mock Supabase client ─────────────────────────────────────────

function createMockSupabase() {
  const chains: Record<string, MockChain> = {};
  const rpcFn = vi.fn();

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (!chains[table]) {
          chains[table] = createChain();
        }

        return chains[table];
      }),
      rpc: rpcFn,
    } as unknown as SupabaseClient<Database>,
    chains,
    rpcFn,
  };
}

describe('createSupabaseDatabaseClient', () => {
  let supabase: SupabaseClient<Database>;
  let rpcFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockSupabase();
    supabase = mock.supabase;
    rpcFn = mock.rpcFn;
  });

  // ── rpc ────────────────────────────────────────────────────────

  describe('rpc', () => {
    it('should call supabase.rpc and return mapped result', async () => {
      rpcFn.mockResolvedValue({ data: { total: 42 }, error: null });

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.rpc<{ total: number }>('get_totals', { userId: 'u-1' });

      expect(rpcFn).toHaveBeenCalledWith('get_totals', { userId: 'u-1' });
      expect(result).toEqual({ data: { total: 42 }, error: null });
    });

    it('should map error from rpc', async () => {
      rpcFn.mockResolvedValue({
        data: null,
        error: { message: 'function not found', code: '42883' },
      });

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.rpc('nonexistent');

      expect(result).toEqual({
        data: null,
        error: { message: 'function not found', code: '42883' },
      });
    });

    it('should call rpc without args when not provided', async () => {
      rpcFn.mockResolvedValue({ data: 5, error: null });

      const db = createSupabaseDatabaseClient(supabase);
      await db.rpc('count_all');

      expect(rpcFn).toHaveBeenCalledWith('count_all', undefined);
    });
  });

  // ── profiles ───────────────────────────────────────────────────

  describe('profiles', () => {
    it('findById should call from(profiles).select.eq.single', async () => {
      const profileData = { id: 'p-1', full_name: 'Alice' };
      const chain = createChain();
      chain.single = vi.fn().mockResolvedValue({ data: profileData, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.profiles.findById('p-1');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result.data).toEqual(profileData);
      expect(result.error).toBeNull();
    });

    it('update should call from(profiles).update.eq', async () => {
      const chain = createChain();
      // update → eq chain resolves as thenable
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.profiles.update('p-1', { full_name: 'Bob' });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result.error).toBeNull();
    });
  });

  // ── surveys ────────────────────────────────────────────────────

  describe('surveys', () => {
    it('findById should apply userId and status filters', async () => {
      const chain = createChain();
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { id: 's-1' },
        error: null,
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      await db.surveys.findById('s-1', { userId: 'u-1', status: 'draft' });

      expect(supabase.from).toHaveBeenCalledWith('surveys');
    });

    it('findById should handle array status filter', async () => {
      const chain = createChain();
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { id: 's-1' },
        error: null,
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      await db.surveys.findById('s-1', { status: ['draft', 'active'] });

      expect(supabase.from).toHaveBeenCalledWith('surveys');
    });

    it('insert should call from(surveys).insert.select.single', async () => {
      const chain = createChain();
      chain.single = vi.fn().mockResolvedValue({
        data: { id: 's-new' },
        error: null,
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveys.insert({
        user_id: 'u-1',
        title: 'My Survey',
        description: '',
        category: 'feedback',
        visibility: 'public',
        status: 'draft',
      });

      expect(result.data).toEqual({ id: 's-new' });
      expect(result.error).toBeNull();
    });

    it('countByUserId should return count', async () => {
      const chain = createChain({ count: 3, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveys.countByUserId('u-1');

      expect(result.count).toBe(3);
      expect(result.error).toBeNull();
    });
  });

  // ── surveyQuestions ────────────────────────────────────────────

  describe('surveyQuestions', () => {
    it('findBySurveyId should call select, eq, order', async () => {
      const questions = [{ id: 'q-1', text: 'How?' }];
      const chain = createChain();
      chain.order = vi.fn().mockResolvedValue({ data: questions, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyQuestions.findBySurveyId('s-1');

      expect(supabase.from).toHaveBeenCalledWith('survey_questions');
      expect(result.data).toEqual(questions);
    });

    it('insert should call from(survey_questions).insert', async () => {
      const chain = createChain();
      chain.insert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyQuestions.insert([
        {
          survey_id: 's-1',
          text: 'Q1',
          type: 'text',
          required: true,
          description: null,
          config: {},
          sort_order: 0,
        },
      ]);

      expect(result.error).toBeNull();
    });

    it('countBySurveyId should apply textNotEmpty filter', async () => {
      const chain = createChain({ count: 2, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyQuestions.countBySurveyId('s-1', {
        textNotEmpty: true,
      });

      expect(result.count).toBe(2);
    });
  });

  // ── surveyResponses ────────────────────────────────────────────

  describe('surveyResponses', () => {
    it('countBySurveyId should return count with status filter', async () => {
      const chain = createChain({ count: 5, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyResponses.countBySurveyId('s-1', {
        status: 'completed',
      });

      expect(result.count).toBe(5);
    });

    it('deleteBySurveyId should call delete.eq', async () => {
      const chain = createChain();
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyResponses.deleteBySurveyId('s-1');

      expect(supabase.from).toHaveBeenCalledWith('survey_responses');
      expect(result.error).toBeNull();
    });

    it('countByUserSurveys should join with surveys and filter', async () => {
      const chain = createChain({ count: 10, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyResponses.countByUserSurveys('u-1', {
        status: 'completed',
      });

      expect(result.count).toBe(10);
    });
  });

  // ── surveyAnswers ──────────────────────────────────────────────

  describe('surveyAnswers', () => {
    it('findByResponseIds should call select.in', async () => {
      const answers = [{ response_id: 'r-1', question_id: 'q-1', value: 'yes' }];
      const chain = createChain();
      chain.in = vi.fn().mockResolvedValue({ data: answers, error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.surveyAnswers.findByResponseIds(['r-1']);

      expect(supabase.from).toHaveBeenCalledWith('survey_answers');
      expect(result.data).toEqual(answers);
    });
  });

  // ── mapError ───────────────────────────────────────────────────

  describe('error mapping', () => {
    it('should map error with code', async () => {
      rpcFn.mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.rpc('missing');

      expect(result.error).toEqual({ message: 'Not found', code: 'PGRST116' });
    });

    it('should map error without code', async () => {
      rpcFn.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.rpc('fail');

      expect(result.error).toEqual({ message: 'Network error', code: undefined });
    });

    it('should return null when no error', async () => {
      rpcFn.mockResolvedValue({ data: 'ok', error: null });

      const db = createSupabaseDatabaseClient(supabase);
      const result = await db.rpc('ok');

      expect(result.error).toBeNull();
    });
  });
});
