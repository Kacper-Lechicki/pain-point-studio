import { GraduationCap, User, Users } from 'lucide-react';

import type { PersonaFeature } from '@/features/marketing/types';

export type DeveloperPersona = PersonaFeature;

export const DEVELOPER_PERSONAS: DeveloperPersona[] = [
  {
    icon: User,
    titleKey: 'marketing.personas.items.solo.title',
    descriptionKey: 'marketing.personas.items.solo.description',
    featuresKey: 'marketing.personas.items.solo.features',
  },
  {
    icon: Users,
    titleKey: 'marketing.personas.items.collaborative.title',
    descriptionKey: 'marketing.personas.items.collaborative.description',
    featuresKey: 'marketing.personas.items.collaborative.features',
  },
  {
    icon: GraduationCap,
    titleKey: 'marketing.personas.items.learning.title',
    descriptionKey: 'marketing.personas.items.learning.description',
    featuresKey: 'marketing.personas.items.learning.features',
  },
];
