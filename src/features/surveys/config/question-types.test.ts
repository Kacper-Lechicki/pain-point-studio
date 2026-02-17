/** Tests for question type configuration, icon/label maps, and getDefaultConfig factory. */
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
  it('should have an entry for every question type', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_CONFIG[type]).toBeDefined();
    }
  });

  it('should have icon, labelKey, and defaultConfig in each entry', () => {
    for (const type of QUESTION_TYPES) {
      const config = QUESTION_TYPE_CONFIG[type];
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('labelKey');
      expect(config).toHaveProperty('defaultConfig');
      expect(typeof config.defaultConfig).toBe('object');
    }
  });

  it('should follow surveys.builder.types.* format for labelKey', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_CONFIG[type].labelKey).toMatch(/^surveys\.builder\.types\./);
    }
  });
});

// ── QUESTION_TYPE_ICONS / QUESTION_TYPE_LABEL_KEYS ───────────────────

describe('QUESTION_TYPE_ICONS', () => {
  it('should have same keys as QUESTION_TYPE_CONFIG', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_ICONS[type]).toBe(QUESTION_TYPE_CONFIG[type].icon);
    }
  });
});

describe('QUESTION_TYPE_LABEL_KEYS', () => {
  it('should have same labelKey values as QUESTION_TYPE_CONFIG', () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_TYPE_LABEL_KEYS[type]).toBe(QUESTION_TYPE_CONFIG[type].labelKey);
    }
  });
});

// ── getDefaultConfig ─────────────────────────────────────────────────

describe('getDefaultConfig', () => {
  it('should return a copy of defaultConfig for the given type', () => {
    const result = getDefaultConfig('open_text');
    expect(result).toEqual(QUESTION_TYPE_CONFIG.open_text.defaultConfig);
    expect(result).not.toBe(QUESTION_TYPE_CONFIG.open_text.defaultConfig);
  });

  it('should return options and allowOther for multiple_choice', () => {
    const result = getDefaultConfig('multiple_choice');
    expect(result).toHaveProperty('options');
    expect(result).toHaveProperty('allowOther');
  });

  it('should return min, max, minLabel, maxLabel for rating_scale', () => {
    const result = getDefaultConfig('rating_scale');
    expect(result).toHaveProperty('min');
    expect(result).toHaveProperty('max');
    expect(result).toHaveProperty('minLabel');
    expect(result).toHaveProperty('maxLabel');
  });

  it('should return empty object for yes_no', () => {
    const result = getDefaultConfig('yes_no');
    expect(result).toEqual({});
  });
});
