import { LucideIcon } from 'lucide-react';

export interface BaseFeature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

export interface PersonaFeature extends BaseFeature {
  featuresKey: string;
}
