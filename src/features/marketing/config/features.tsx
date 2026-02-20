import {
  BarChart3,
  FileQuestion,
  Layout,
  Link2,
  Lock,
  MousePointer2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import type { BaseFeature } from '@/features/marketing/types';

export const MINIMALISM_FEATURES: BaseFeature[] = [
  {
    icon: Sparkles,
    titleKey: 'marketing.functionalMinimalism.items.onboarding.title',
    descriptionKey: 'marketing.functionalMinimalism.items.onboarding.description',
  },
  {
    icon: Layout,
    titleKey: 'marketing.functionalMinimalism.items.bloat.title',
    descriptionKey: 'marketing.functionalMinimalism.items.bloat.description',
  },
  {
    icon: Shield,
    titleKey: 'marketing.functionalMinimalism.items.solo.title',
    descriptionKey: 'marketing.functionalMinimalism.items.solo.description',
  },
  {
    icon: MousePointer2,
    titleKey: 'marketing.functionalMinimalism.items.action.title',
    descriptionKey: 'marketing.functionalMinimalism.items.action.description',
  },
];

export const GRID_FEATURES: BaseFeature[] = [
  {
    icon: FileQuestion,
    titleKey: 'marketing.features.items.templates.title',
    descriptionKey: 'marketing.features.items.templates.description',
  },
  {
    icon: Link2,
    titleKey: 'marketing.features.items.sharing.title',
    descriptionKey: 'marketing.features.items.sharing.description',
  },
  {
    icon: BarChart3,
    titleKey: 'marketing.features.items.patterns.title',
    descriptionKey: 'marketing.features.items.patterns.description',
  },
  {
    icon: Lock,
    titleKey: 'marketing.features.items.privacy.title',
    descriptionKey: 'marketing.features.items.privacy.description',
  },
  {
    icon: Users,
    titleKey: 'marketing.features.items.community.title',
    descriptionKey: 'marketing.features.items.community.description',
  },
  {
    icon: Zap,
    titleKey: 'marketing.features.items.setup.title',
    descriptionKey: 'marketing.features.items.setup.description',
  },
];
