import dynamic from 'next/dynamic';

import { BarChart3, Lightbulb, MessageSquare, Share2 } from 'lucide-react';

const IdeaTrendsChart = dynamic(
  () =>
    import('@/features/marketing/components/charts/idea-trends-chart').then(
      (mod) => mod.IdeaTrendsChart
    ),
  { ssr: true }
);

const QuestionEngagementChart = dynamic(
  () =>
    import('@/features/marketing/components/charts/question-engagement-chart').then(
      (mod) => mod.QuestionEngagementChart
    ),
  { ssr: true }
);

const ResponsesGrowthChart = dynamic(
  () =>
    import('@/features/marketing/components/charts/responses-growth-chart').then(
      (mod) => mod.ResponsesGrowthChart
    ),
  { ssr: true }
);

const PainPointsChart = dynamic(
  () =>
    import('@/features/marketing/components/charts/pain-points-chart').then(
      (mod) => mod.PainPointsChart
    ),
  { ssr: true }
);

export interface HowItWorksStep {
  id: number;
  stepKey: string;
  visualIcon: React.ElementType;
  visualChart?: React.ElementType;
  extraType?: 'example' | 'questions' | 'share' | 'stats';
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: 1,
    stepKey: 'research',
    visualIcon: Lightbulb,
    visualChart: IdeaTrendsChart,
    extraType: 'example',
  },
  {
    id: 2,
    stepKey: 'questions',
    visualIcon: MessageSquare,
    visualChart: QuestionEngagementChart,
    extraType: 'questions',
  },
  {
    id: 3,
    stepKey: 'share',
    visualIcon: Share2,
    visualChart: ResponsesGrowthChart,
    extraType: 'share',
  },
  {
    id: 4,
    stepKey: 'patterns',
    visualIcon: BarChart3,
    visualChart: PainPointsChart,
    extraType: 'stats',
  },
];
