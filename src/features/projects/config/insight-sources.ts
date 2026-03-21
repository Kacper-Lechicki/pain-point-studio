import { BarChart3, Eye, FileSearch, MessageSquare, Users } from 'lucide-react';

import type { InsightSource } from '@/features/projects/types';

export const INSIGHT_SOURCE_CONFIG = {
  survey: {
    label: 'projects.insightSources.survey',
    icon: BarChart3,
  },
  user_interview: {
    label: 'projects.insightSources.userInterview',
    icon: Users,
  },
  competitor_analysis: {
    label: 'projects.insightSources.competitorAnalysis',
    icon: FileSearch,
  },
  market_research: {
    label: 'projects.insightSources.marketResearch',
    icon: Eye,
  },
  own_observation: {
    label: 'projects.insightSources.ownObservation',
    icon: MessageSquare,
  },
} satisfies Record<InsightSource, { label: string; icon: typeof BarChart3 }>;
