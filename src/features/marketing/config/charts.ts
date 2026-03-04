import type { ChartConfig } from '@/components/ui/chart';

/**
 * Translate chart config labels using a scoped i18n `t()` function.
 * Each config entry's `label` is resolved via `t(`chart.${label}`)`.
 */
export function localizeChartConfig<T extends ChartConfig>(
  config: T,
  t: (key: string) => string
): T {
  return {
    ...config,
    ...Object.fromEntries(
      Object.entries(config).map(([key, value]) => [
        key,
        {
          ...value,
          label: value.label ? t(`chart.${value.label}`) : undefined,
        },
      ])
    ),
  } as T;
}

// ── Idea Trends (line chart) ────────────────────────────────────────

interface IdeaTrendsDataPoint {
  month: string;
  desktop: number;
  mobile: number;
}

export const IDEA_TRENDS_DATA: IdeaTrendsDataPoint[] = [
  { month: 'january', desktop: 186, mobile: 80 },
  { month: 'february', desktop: 305, mobile: 200 },
  { month: 'march', desktop: 237, mobile: 120 },
  { month: 'april', desktop: 73, mobile: 190 },
  { month: 'may', desktop: 209, mobile: 130 },
  { month: 'june', desktop: 214, mobile: 140 },
];

export const IDEA_TRENDS_CONFIG = {
  desktop: {
    label: 'desktop',
    color: 'var(--chart-violet)',
  },
  mobile: {
    label: 'mobile',
    color: 'var(--chart-cyan)',
  },
} satisfies ChartConfig;

// ── Pain Points (bar chart) ─────────────────────────────────────────

interface PainPointsDataPoint {
  painPoint: string;
  intensity: number;
  fill: string;
}

export const PAIN_POINTS_DATA: PainPointsDataPoint[] = [
  { painPoint: 'price', intensity: 45, fill: 'var(--success)' },
  { painPoint: 'speed', intensity: 80, fill: 'var(--error)' },
  { painPoint: 'ux', intensity: 65, fill: 'var(--chart-purple)' },
  { painPoint: 'support', intensity: 30, fill: 'var(--info)' },
];

export const PAIN_POINTS_CONFIG = {
  intensity: {
    label: 'intensity',
  },
  price: {
    label: 'price',
    color: 'var(--success)',
  },
  speed: {
    label: 'speed',
    color: 'var(--error)',
  },
  ux: {
    label: 'ux',
    color: 'var(--chart-purple)',
  },
  support: {
    label: 'support',
    color: 'var(--info)',
  },
} satisfies ChartConfig;

// ── Question Engagement (horizontal bar chart) ─────────────────────

interface QuestionEngagementDataPoint {
  activity: string;
  count: number;
  fill: string;
}

export const QUESTION_ENGAGEMENT_DATA: QuestionEngagementDataPoint[] = [
  { activity: 'form_fill', count: 320, fill: 'var(--chart-rose)' },
  { activity: 'scroll', count: 450, fill: 'var(--warning)' },
  { activity: 'click', count: 580, fill: 'var(--chart-emerald)' },
  { activity: 'view', count: 890, fill: 'var(--info)' },
];

export const QUESTION_ENGAGEMENT_CONFIG = {
  count: {
    label: 'count',
  },
  view: {
    label: 'view',
    color: 'var(--info)',
  },
  click: {
    label: 'click',
    color: 'var(--chart-emerald)',
  },
  scroll: {
    label: 'scroll',
    color: 'var(--warning)',
  },
  form_fill: {
    label: 'formFill',
    color: 'var(--chart-rose)',
  },
} satisfies ChartConfig;

// ── Responses Growth (area chart) ───────────────────────────────────

interface ResponsesGrowthDataPoint {
  day: string;
  visitors: number;
}

export const RESPONSES_GROWTH_DATA: ResponsesGrowthDataPoint[] = [
  { day: 'mon', visitors: 10 },
  { day: 'tue', visitors: 25 },
  { day: 'wed', visitors: 45 },
  { day: 'thu', visitors: 80 },
  { day: 'fri', visitors: 140 },
  { day: 'sat', visitors: 210 },
  { day: 'sun', visitors: 350 },
];

export const RESPONSES_GROWTH_CONFIG = {
  visitors: {
    label: 'visitors',
    color: 'var(--chart-pink)',
  },
} satisfies ChartConfig;
