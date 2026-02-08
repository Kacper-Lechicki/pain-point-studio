import { LucideIcon } from 'lucide-react';

import type { MessageKey } from '@/i18n/types';

export interface BaseFeature {
  icon: LucideIcon;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
}

export interface PersonaFeature extends BaseFeature {
  featuresKey: MessageKey;
}
