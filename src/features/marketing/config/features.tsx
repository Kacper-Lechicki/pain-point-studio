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

import { BaseFeature } from '@/features/marketing/types';

export type MinimalismFeature = BaseFeature;

export const MINIMALISM_FEATURES: MinimalismFeature[] = [
  {
    icon: Sparkles,
    titleKey: 'Marketing.minimalism.items.onboarding.title',
    descriptionKey: 'Marketing.minimalism.items.onboarding.description',
  },
  {
    icon: Layout,
    titleKey: 'Marketing.minimalism.items.bloat.title',
    descriptionKey: 'Marketing.minimalism.items.bloat.description',
  },
  {
    icon: Shield,
    titleKey: 'Marketing.minimalism.items.solo.title',
    descriptionKey: 'Marketing.minimalism.items.solo.description',
  },
  {
    icon: MousePointer2,
    titleKey: 'Marketing.minimalism.items.action.title',
    descriptionKey: 'Marketing.minimalism.items.action.description',
  },
];

export type GridFeature = BaseFeature;

export const GRID_FEATURES: GridFeature[] = [
  {
    icon: FileQuestion,
    titleKey: 'Marketing.featuresGrid.items.templates.title',
    descriptionKey: 'Marketing.featuresGrid.items.templates.description',
  },
  {
    icon: Link2,
    titleKey: 'Marketing.featuresGrid.items.sharing.title',
    descriptionKey: 'Marketing.featuresGrid.items.sharing.description',
  },
  {
    icon: BarChart3,
    titleKey: 'Marketing.featuresGrid.items.patterns.title',
    descriptionKey: 'Marketing.featuresGrid.items.patterns.description',
  },
  {
    icon: Lock,
    titleKey: 'Marketing.featuresGrid.items.privacy.title',
    descriptionKey: 'Marketing.featuresGrid.items.privacy.description',
  },
  {
    icon: Users,
    titleKey: 'Marketing.featuresGrid.items.community.title',
    descriptionKey: 'Marketing.featuresGrid.items.community.description',
  },
  {
    icon: Zap,
    titleKey: 'Marketing.featuresGrid.items.setup.title',
    descriptionKey: 'Marketing.featuresGrid.items.setup.description',
  },
];
