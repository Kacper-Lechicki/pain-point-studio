import { GraduationCap, User, Users } from 'lucide-react';

import { PersonaFeature } from '@/types';

export type DeveloperPersona = PersonaFeature;

export const DEVELOPER_PERSONAS: DeveloperPersona[] = [
  {
    icon: User,
    titleKey: 'Marketing.developers.items.solo.title',
    descriptionKey: 'Marketing.developers.items.solo.description',
    featuresKey: 'Marketing.developers.items.solo.features',
  },
  {
    icon: Users,
    titleKey: 'Marketing.developers.items.collaborative.title',
    descriptionKey: 'Marketing.developers.items.collaborative.description',
    featuresKey: 'Marketing.developers.items.collaborative.features',
  },
  {
    icon: GraduationCap,
    titleKey: 'Marketing.developers.items.learning.title',
    descriptionKey: 'Marketing.developers.items.learning.description',
    featuresKey: 'Marketing.developers.items.learning.features',
  },
];
