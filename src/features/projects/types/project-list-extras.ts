import { z } from 'zod';

export const sparklinePointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

export const projectExtrasSchema = z.object({
  draftCount: z.number(),
  activeCount: z.number(),
  completedCount: z.number(),
  nearestEndsAt: z.string().nullable(),
  sparkline: z.array(sparklinePointSchema),
});

export type ProjectListExtras = z.infer<typeof projectExtrasSchema>;
export type SparklinePoint = z.infer<typeof sparklinePointSchema>;

export type ProjectsListExtrasMap = Record<string, ProjectListExtras>;

export const projectExtrasMapSchema = z.record(z.string(), projectExtrasSchema);
