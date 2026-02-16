import { describe, expect, it } from 'vitest';

import type { QuestionType } from '@/features/surveys/types';

import {
  QUESTION_TYPE_CONFIG,
  QUESTION_TYPE_ICONS,
  QUESTION_TYPE_LABEL_KEYS,
  getDefaultConfig,
} from './question-types';

const QUESTION_TYPES: QuestionType[] = [
  'open_text',
  'short_text',
  'multiple_choice',
  'rating_scale',
  'yes_no',
];

// ── QUESTION_TYPE_CONFIG ─────────────────────────────────────────────

describe('QUESTION_TYPE_CONFIG', () => {
  // Every question type has a config entry.
  it('has an entry for every question type', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_CONFIG[type]).toBeDefined();
    }
  });

  // Each entry has icon, labelKey, defaultConfig.
  it('each entry has icon, labelKey, and defaultConfig', () => {
    for (const type of QUESTION_TYPES) {
      const config = QUESTION_TYPE_CONFIG[type];
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('labelKey');
      expect(config).toHaveProperty('defaultConfig');
      expect(typeof config.defaultConfig).toBe('object');
    }
  });

  // labelKey matches surveys.builder.types.*.
  it('labelKey follows surveys.builder.types.* format', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_CONFIG[type].labelKey).toMatch(/^surveys\.builder\.types\./);
    }
  });
});

// ── QUESTION_TYPE_ICONS / QUESTION_TYPE_LABEL_KEYS ───────────────────

describe('QUESTION_TYPE_ICONS', () => {
  // Icons match QUESTION_TYPE_CONFIG icons.
  it('has same keys as QUESTION_TYPE_CONFIG', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_ICONS[type]).toBe(QUESTION_TYPE_CONFIG[type].icon);
    }
  });
});

describe('QUESTION_TYPE_LABEL_KEYS', () => {
  // Label keys match QUESTION_TYPE_CONFIG.
  it('has same labelKey values as QUESTION_TYPE_CONFIG', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_LABEL_KEYS[type]).toBe(QUESTION_TYPE_CONFIG[type].labelKey);
    }
  });
});

// ── getDefaultConfig ─────────────────────────────────────────────────

describe('getDefaultConfig', () => {
  // Returns a shallow copy, not the same reference.
  it('returns a copy of defaultConfig for the given type', () => {
    const result = getDefaultConfig('open_text');
    expect(result).toEqual(QUESTION_TYPE_CONFIG.open_text.defaultConfig);
    expect(result).not.toBe(QUESTION_TYPE_CONFIG.open_text.defaultConfig);
  });

  // multiple_choice has options and allowOther.
  it('multiple_choice returns options and allowOther', () => {
    const result = getDefaultConfig('multiple_choice');
    expect(result).toHaveProperty('options');
    expect(result).toHaveProperty('allowOther');
  });

  // rating_scale has min, max, minLabel, maxLabel.
  it('rating_scale returns min, max, minLabel, maxLabel', () => {
    const result = getDefaultConfig('rating_scale');
    expect(result).toHaveProperty('min');
    expect(result).toHaveProperty('max');
    expect(result).toHaveProperty('minLabel');
    expect(result).toHaveProperty('maxLabel');
  });

  // yes_no has no default config keys.
  it('yes_no returns empty object', () => {
    const result = getDefaultConfig('yes_no');
    expect(result).toEqual({});
  });
});
