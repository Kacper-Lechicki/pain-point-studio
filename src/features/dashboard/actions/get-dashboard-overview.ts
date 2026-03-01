'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────────

export interface OverviewProject {
  id: string;
  name: string;
  summary: string | null;
  status: string;
  updatedAt: string;
  surveyCount: number;
  responseCount: number;
}

export interface DashboardOverview {
  projects: OverviewProject[];
}

// ── Validation ───────────────────────────────────────────────────────

const overviewProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().nullable(),
  status: z.string(),
  updatedAt: z.string(),
  surveyCount: z.number(),
  responseCount: z.number(),
});

const overviewResponseSchema = z.array(overviewProjectSchema);

// ── Action ───────────────────────────────────────────────────────────

/**
 * Fetch dashboard overview via get_dashboard_overview RPC.
 * Returns null when unauthenticated, on RPC error, or when the response fails validation.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getDashboardOverview = cache(async (): Promise<DashboardOverview | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_dashboard_overview', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = overviewResponseSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return { projects: parsed.data };
});
