import { Code2, HelpCircle, Users } from 'lucide-react';

import type { BaseFeature } from '@/features/marketing/types';

export type Problem = BaseFeature;

export const PROBLEMS: Problem[] = [
  {
    icon: Code2,
    titleKey: 'marketing.problems.items.vacuum.title',
    descriptionKey: 'marketing.problems.items.vacuum.description',
  },
  {
    icon: HelpCircle,
    titleKey: 'marketing.problems.items.skills.title',
    descriptionKey: 'marketing.problems.items.skills.description',
  },
  {
    icon: Users,
    titleKey: 'marketing.problems.items.access.title',
    descriptionKey: 'marketing.problems.items.access.description',
  },
];
