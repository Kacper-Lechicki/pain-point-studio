import { BarChart3, Lightbulb, MessageSquare, Share2 } from 'lucide-react';

import { IdeaTrendsChart } from '@/features/marketing/components/charts/idea-trends-chart';
import { PainPointsChart } from '@/features/marketing/components/charts/pain-points-chart';
import { QuestionEngagementChart } from '@/features/marketing/components/charts/question-engagement-chart';
import { ResponsesGrowthChart } from '@/features/marketing/components/charts/responses-growth-chart';

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
