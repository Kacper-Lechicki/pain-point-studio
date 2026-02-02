import { Code2, HelpCircle, Users } from 'lucide-react';

import { BaseFeature } from '@/types';

export type Problem = BaseFeature;

export const PROBLEMS: Problem[] = [
  {
    icon: Code2,
    titleKey: 'Marketing.problems.items.vacuum.title',
    descriptionKey: 'Marketing.problems.items.vacuum.description',
  },
  {
    icon: HelpCircle,
    titleKey: 'Marketing.problems.items.skills.title',
    descriptionKey: 'Marketing.problems.items.skills.description',
  },
  {
    icon: Users,
    titleKey: 'Marketing.problems.items.access.title',
    descriptionKey: 'Marketing.problems.items.access.description',
  },
];
