import type { LucideIcon } from 'lucide-react';

import type { MessageKey } from '@/i18n/types';

/** Shared shape for marketing section cards (icon + i18n title/description). */
export interface BaseFeature {
  icon: LucideIcon;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
}

/** Persona card — extends BaseFeature with a list of bullet-point features. */
export interface PersonaFeature extends BaseFeature {
  featuresKey: MessageKey;
}
