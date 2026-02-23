/** Tests for survey status config, transition rules, action availability, and derived flags. */
import { describe, expect, it } from 'vitest';

import type { SurveyStatus } from '@/features/surveys/types';

import {
  SURVEY_ACTION_UI,
  SURVEY_STATUS_CONFIG,
  SURVEY_TRANSITIONS,
  canTransition,
  deriveSurveyFlags,
  getAvailableActions,
} from './survey-status';

// ── SURVEY_STATUS_CONFIG ────────────────────────────────────────────

describe('SURVEY_STATUS_CONFIG', () => {
  const statuses: SurveyStatus[] = ['draft', 'active', 'completed', 'cancelled', 'archived'];

  it('should have an entry for every status', () => {
    for (const status of statuses) {
      expect(SURVEY_STATUS_CONFIG[status]).toBeDefined();
    }
  });

  it('should have an icon, labelKey, descriptionKey, ariaLabelKey, and badge config in each entry', () => {
    for (const status of statuses) {
      const config = SURVEY_STATUS_CONFIG[status];

      expect(config.icon).toBeDefined();
      expect(config.labelKey).toMatch(/^surveys\./);
      expect(config.descriptionKey).toMatch(/^surveys\./);
      expect(config.ariaLabelKey).toMatch(/^surveys\./);
      expect(config.badge).toHaveProperty('variant');
      expect(config.badge).toHaveProperty('showPulseDot');
    }
  });

  it('should not have showPulseDot enabled on any status', () => {
    for (const config of Object.values(SURVEY_STATUS_CONFIG)) {
      expect(config.badge.showPulseDot).toBe(false);
    }
  });
});

// ── canTransition ───────────────────────────────────────────────────

describe('canTransition', () => {
  it('should allow completing an active survey', () => {
    expect(canTransition('active', 'complete')).toBe(true);
  });

  it('should not allow completing a draft', () => {
    expect(canTransition('draft', 'complete')).toBe(false);
  });

  it('should allow cancelling an active survey', () => {
    expect(canTransition('active', 'cancel')).toBe(true);
  });

  it('should not allow cancelling a draft', () => {
    expect(canTransition('draft', 'cancel')).toBe(false);
  });

  it('should allow archiving a draft', () => {
    expect(canTransition('draft', 'archive')).toBe(true);
  });

  it('should allow archiving a completed survey', () => {
    expect(canTransition('completed', 'archive')).toBe(true);
  });

  it('should allow archiving a cancelled survey', () => {
    expect(canTransition('cancelled', 'archive')).toBe(true);
  });

  it('should allow restoring an archived survey', () => {
    expect(canTransition('archived', 'restore')).toBe(true);
  });

  it('should not allow restoring an active survey', () => {
    expect(canTransition('active', 'restore')).toBe(false);
  });

  it('should allow deleting a draft', () => {
    expect(canTransition('draft', 'delete')).toBe(true);
  });

  it('should allow deleting an archived survey', () => {
    expect(canTransition('archived', 'delete')).toBe(true);
  });

  it('should not allow deleting an active survey', () => {
    expect(canTransition('active', 'delete')).toBe(false);
  });
});

// ── getAvailableActions ─────────────────────────────────────────────

describe('getAvailableActions', () => {
  it('should allow archiving or deleting a draft', () => {
    const actions = getAvailableActions('draft');

    expect(actions).toContain('archive');
    expect(actions).toContain('delete');
    expect(actions).not.toContain('complete');
  });

  it('should allow completing or cancelling an active survey', () => {
    const actions = getAvailableActions('active');

    expect(actions).toContain('complete');
    expect(actions).toContain('cancel');
  });

  it('should allow restoring or deleting an archived survey', () => {
    const actions = getAvailableActions('archived');

    expect(actions).toContain('restore');
    expect(actions).toContain('delete');
    expect(actions).toHaveLength(2);
  });

  it('should only allow archiving a completed survey', () => {
    const actions = getAvailableActions('completed');

    expect(actions).toEqual(['archive']);
  });
});

// ── deriveSurveyFlags ───────────────────────────────────────────────

describe('deriveSurveyFlags', () => {
  it('should set isDraft for draft status', () => {
    const flags = deriveSurveyFlags('draft');

    expect(flags.isDraft).toBe(true);
    expect(flags.isActive).toBe(false);
  });

  it('should set isActive for active status', () => {
    const flags = deriveSurveyFlags('active');

    expect(flags.isActive).toBe(true);
    expect(flags.isDraft).toBe(false);
  });

  it('should set isArchived for archived status', () => {
    const flags = deriveSurveyFlags('archived');

    expect(flags.isArchived).toBe(true);
  });
});

// ── SURVEY_TRANSITIONS ──────────────────────────────────────────────

describe('SURVEY_TRANSITIONS', () => {
  it('should have valid fromStatuses arrays for all actions', () => {
    for (const [, transition] of Object.entries(SURVEY_TRANSITIONS)) {
      expect(Array.isArray(transition.fromStatuses)).toBe(true);
      expect(transition.fromStatuses.length).toBeGreaterThan(0);
    }
  });

  it('should use method "delete" for delete', () => {
    expect(SURVEY_TRANSITIONS.delete.method).toBe('delete');
  });

  it('should use method "update" for complete', () => {
    expect(SURVEY_TRANSITIONS.complete.method).toBe('update');
  });
});

describe('SURVEY_TRANSITIONS – restore always targets draft', () => {
  it('should have restore toStatus as draft', () => {
    expect(SURVEY_TRANSITIONS.restore.toStatus).toBe('draft');
  });

  it('should include both draft and archived in delete fromStatuses', () => {
    expect(SURVEY_TRANSITIONS.delete.fromStatuses).toContain('draft');
    expect(SURVEY_TRANSITIONS.delete.fromStatuses).toContain('archived');
  });
});

// ── SURVEY_ACTION_UI ────────────────────────────────────────────────

describe('SURVEY_ACTION_UI', () => {
  it('should have UI config for every action in SURVEY_TRANSITIONS', () => {
    for (const action of Object.keys(SURVEY_TRANSITIONS)) {
      expect(SURVEY_ACTION_UI[action as keyof typeof SURVEY_ACTION_UI]).toBeDefined();
    }
  });

  it('should have default confirm dialog for restore', () => {
    expect(SURVEY_ACTION_UI.restore.confirm?.variant).toBe('default');
  });

  it('should have destructive confirm dialog for delete', () => {
    expect(SURVEY_ACTION_UI.delete.confirm?.variant).toBe('destructive');
  });
});
