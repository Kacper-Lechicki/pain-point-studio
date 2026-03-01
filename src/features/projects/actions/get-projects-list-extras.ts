'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const sparklinePointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const projectExtrasSchema = z.object({
  draftCount: z.number(),
  activeCount: z.number(),
  completedCount: z.number(),
  nearestEndsAt: z.string().nullable(),
  sparkline: z.array(sparklinePointSchema),
});

export type ProjectListExtras = z.infer<typeof projectExtrasSchema>;
export type SparklinePoint = z.infer<typeof sparklinePointSchema>;

const resultSchema = z.record(z.string(), projectExtrasSchema);

export type ProjectsListExtrasMap = z.infer<typeof resultSchema>;

/**
 * Fetch batch extras (smart status data + sparkline) for all user projects.
 * Returns a map keyed by project ID, or null on error.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getProjectsListExtras = cache(async (): Promise<ProjectsListExtrasMap | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_projects_list_extras', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = resultSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
