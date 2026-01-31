import { BarChart3, Lightbulb, MessageSquare, Share2 } from 'lucide-react';

import { IdeaTrendsChart } from '@/components/marketing/charts/idea-trends-chart';
import { PainPointsChart } from '@/components/marketing/charts/pain-points-chart';
import { QuestionEngagementChart } from '@/components/marketing/charts/question-engagement-chart';
import { ResponsesGrowthChart } from '@/components/marketing/charts/responses-growth-chart';
import { CopyableLink } from '@/components/marketing/elements/copyable-link';

export interface Step {
  id: number;
  title: string;
  description: string;
  visualIcon: React.ElementType;
  visualLabel: string;
  visualChart?: React.ElementType;
  renderExtra?: () => React.ReactNode;
}

export const steps: Step[] = [
  {
    id: 1,
    title: 'Choose Your Research Area',
    description:
      'Pick any topic you\'re curious about. "Productivity for ADHD" or "Developer Tools" or "Remote Team Management". No perfect idea needed.',
    visualIcon: Lightbulb,
    visualLabel: 'Research Area Selection Interface',
    visualChart: IdeaTrendsChart,
    renderExtra: () => (
      <div className="bg-card text-card-foreground mt-6 rounded-lg border p-4 text-left text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          Example: Developer Productivity
        </div>

        <p className="text-muted-foreground mt-2 leading-relaxed">
          Exploring pain points around focus, task management, and workflow optimization for
          software engineers.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Use Proven Questions',
    description:
      'We provide research-backed question templates. No guessing. No leading questions. Just proven patterns that uncover real pain points.',
    visualIcon: MessageSquare,
    visualLabel: 'Pre-Built Question Templates',
    visualChart: QuestionEngagementChart,
    renderExtra: () => (
      <div className="mt-6 flex flex-col gap-3">
        <div className="bg-card text-card-foreground rounded-lg border p-3 text-sm shadow-sm">
          `Describe the last time you <strong>felt</strong> you lost control of your time at work.
          What happened?`
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-3 text-sm shadow-sm">
          `What tools do you currently use? What frustrates you most about them?`
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Share & Collect Responses',
    description:
      'Get a simple link. Share it anywhere - Twitter, LinkedIn, Reddit, Discord. Zero friction for respondents. No login required. 10 minutes to complete.',
    visualIcon: Share2,
    visualLabel: 'Share Research Interface',
    visualChart: ResponsesGrowthChart,
    renderExtra: () => <CopyableLink link="painpoint.studio/r/dev-productivity-2025" />,
  },
  {
    id: 4,
    title: 'See Patterns Emerge',
    description:
      "After 10-20 responses, patterns become obvious. Either you see a clear problem worth solving, or you don't. No more analysis paralysis.",
    visualIcon: BarChart3,
    visualLabel: 'Response Analysis Dashboard',
    visualChart: PainPointsChart,
    renderExtra: () => (
      <div className="mt-6 flex flex-col gap-3">
        <div className="bg-card text-card-foreground flex items-center justify-between rounded-lg border p-4 shadow-sm">
          <span className="text-sm font-medium">Responses Collected</span>
          <span className="text-xl font-bold">23</span>
        </div>

        <div className="bg-card text-card-foreground flex items-center justify-between rounded-lg border p-4 shadow-sm">
          <span className="text-sm font-medium">Common Pain Points</span>
          <span className="text-xl font-bold">5</span>
        </div>
      </div>
    ),
  },
];
