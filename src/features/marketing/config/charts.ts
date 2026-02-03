import { ChartConfig } from '@/components/ui/chart';

export interface IdeaTrendsDataPoint {
  month: string;
  desktop: number;
  mobile: number;
}

export const IDEA_TRENDS_DATA: IdeaTrendsDataPoint[] = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

export const IDEA_TRENDS_CONFIG = {
  desktop: {
    label: 'desktop',
    color: '#8b5cf6',
  },
  mobile: {
    label: 'mobile',
    color: '#06b6d4',
  },
} satisfies ChartConfig;

export interface PainPointsDataPoint {
  painPoint: string;
  intensity: number;
  fill: string;
}

export const PAIN_POINTS_DATA: PainPointsDataPoint[] = [
  { painPoint: 'Price', intensity: 45, fill: '#22c55e' },
  { painPoint: 'Speed', intensity: 80, fill: '#ef4444' },
  { painPoint: 'UX', intensity: 65, fill: '#a855f7' },
  { painPoint: 'Support', intensity: 30, fill: '#3b82f6' },
];

export const PAIN_POINTS_CONFIG = {
  intensity: {
    label: 'intensity',
  },
  price: {
    label: 'price',
    color: '#22c55e',
  },
  speed: {
    label: 'speed',
    color: '#ef4444',
  },
  ux: {
    label: 'ux',
    color: '#a855f7',
  },
  support: {
    label: 'support',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

export interface QuestionEngagementDataPoint {
  activity: string;
  count: number;
  fill: string;
}

export const QUESTION_ENGAGEMENT_DATA: QuestionEngagementDataPoint[] = [
  { activity: 'form_fill', count: 320, fill: '#e11d48' },
  { activity: 'scroll', count: 450, fill: '#f59e0b' },
  { activity: 'click', count: 580, fill: '#10b981' },
  { activity: 'view', count: 890, fill: '#3b82f6' },
];

export const QUESTION_ENGAGEMENT_CONFIG = {
  count: {
    label: 'count',
  },
  view: {
    label: 'view',
    color: '#3b82f6',
  },
  click: {
    label: 'click',
    color: '#10b981',
  },
  scroll: {
    label: 'scroll',
    color: '#f59e0b',
  },
  form_fill: {
    label: 'formFill',
    color: '#e11d48',
  },
} satisfies ChartConfig;

export interface ResponsesGrowthDataPoint {
  day: string;
  visitors: number;
}

export const RESPONSES_GROWTH_DATA: ResponsesGrowthDataPoint[] = [
  { day: 'Mon', visitors: 10 },
  { day: 'Tue', visitors: 25 },
  { day: 'Wed', visitors: 45 },
  { day: 'Thu', visitors: 80 },
  { day: 'Fri', visitors: 140 },
  { day: 'Sat', visitors: 210 },
  { day: 'Sun', visitors: 350 },
];

export const RESPONSES_GROWTH_CONFIG = {
  visitors: {
    label: 'visitors',
    color: '#ec4899',
  },
} satisfies ChartConfig;
