import { z } from 'zod';

export const overviewProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().nullable(),
  status: z.string(),
  updatedAt: z.string(),
  surveyCount: z.number(),
  responseCount: z.number(),
});

export const overviewResponseSchema = z.array(overviewProjectSchema);

export interface OverviewProject {
  id: string;
  name: string;
  summary: string | null;
  status: string;
  updatedAt: string;
  surveyCount: number;
  responseCount: number;
}
