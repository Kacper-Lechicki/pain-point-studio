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
  const statuses: SurveyStatus[] = ['draft', 'active', 'closed', 'cancelled', 'archived'];

  it('has an entry for every status', () => {
    for (const status of statuses) {
      expect(SURVEY_STATUS_CONFIG[status]).toBeDefined();
    }
  });

  it('each entry has an icon, labelKey, and badge config', () => {
    for (const status of statuses) {
      const config = SURVEY_STATUS_CONFIG[status];

      expect(config.icon).toBeDefined();
      expect(config.labelKey).toMatch(/^surveys\./);
      expect(config.badge).toHaveProperty('variant');
      expect(config.badge).toHaveProperty('showPulseDot');
    }
  });

  it('no status has showPulseDot enabled', () => {
    for (const config of Object.values(SURVEY_STATUS_CONFIG)) {
      expect(config.badge.showPulseDot).toBe(false);
    }
  });
});

// ── canTransition ───────────────────────────────────────────────────

describe('canTransition', () => {
  it('allows closing an active survey', () => {
    expect(canTransition('active', 'close')).toBe(true);
  });

  it('does not allow closing a draft', () => {
    expect(canTransition('draft', 'close')).toBe(false);
  });

  it('allows cancelling an active survey', () => {
    expect(canTransition('active', 'cancel')).toBe(true);
  });

  it('does not allow cancelling a draft', () => {
    expect(canTransition('draft', 'cancel')).toBe(false);
  });

  it('allows archiving a draft', () => {
    expect(canTransition('draft', 'archive')).toBe(true);
  });

  it('allows archiving a closed survey', () => {
    expect(canTransition('closed', 'archive')).toBe(true);
  });

  it('allows archiving a cancelled survey', () => {
    expect(canTransition('cancelled', 'archive')).toBe(true);
  });

  it('allows restoring an archived survey', () => {
    expect(canTransition('archived', 'restore')).toBe(true);
  });

  it('does not allow restoring an active survey', () => {
    expect(canTransition('active', 'restore')).toBe(false);
  });

  it('allows deleting a draft', () => {
    expect(canTransition('draft', 'delete')).toBe(true);
  });

  it('allows deleting an archived survey', () => {
    expect(canTransition('archived', 'delete')).toBe(true);
  });

  it('does not allow deleting an active survey', () => {
    expect(canTransition('active', 'delete')).toBe(false);
  });
});

// ── getAvailableActions ─────────────────────────────────────────────

describe('getAvailableActions', () => {
  it('draft can be archived or deleted', () => {
    const actions = getAvailableActions('draft');

    expect(actions).toContain('archive');
    expect(actions).toContain('delete');
    expect(actions).not.toContain('close');
  });

  it('active can be closed or cancelled', () => {
    const actions = getAvailableActions('active');

    expect(actions).toContain('close');
    expect(actions).toContain('cancel');
  });

  it('archived can be restored or deleted', () => {
    const actions = getAvailableActions('archived');

    expect(actions).toContain('restore');
    expect(actions).toContain('delete');
    expect(actions).toHaveLength(2);
  });

  it('closed can only be archived', () => {
    const actions = getAvailableActions('closed');

    expect(actions).toEqual(['archive']);
  });
});

// ── deriveSurveyFlags ───────────────────────────────────────────────

describe('deriveSurveyFlags', () => {
  it('sets isDraft for draft status', () => {
    const flags = deriveSurveyFlags('draft');

    expect(flags.isDraft).toBe(true);
    expect(flags.isActive).toBe(false);
  });

  it('sets isActive for active status', () => {
    const flags = deriveSurveyFlags('active');

    expect(flags.isActive).toBe(true);
    expect(flags.isDraft).toBe(false);
  });

  it('sets isArchived for archived status', () => {
    const flags = deriveSurveyFlags('archived');

    expect(flags.isArchived).toBe(true);
  });
});

// ── SURVEY_TRANSITIONS ──────────────────────────────────────────────

describe('SURVEY_TRANSITIONS', () => {
  it('all actions have valid fromStatuses arrays', () => {
    for (const [, transition] of Object.entries(SURVEY_TRANSITIONS)) {
      expect(Array.isArray(transition.fromStatuses)).toBe(true);
      expect(transition.fromStatuses.length).toBeGreaterThan(0);
    }
  });

  it('delete uses method "delete"', () => {
    expect(SURVEY_TRANSITIONS.delete.method).toBe('delete');
  });

  it('close uses method "update"', () => {
    expect(SURVEY_TRANSITIONS.close.method).toBe('update');
  });
});

describe('SURVEY_TRANSITIONS – restore always targets draft', () => {
  it('restore toStatus is draft', () => {
    expect(SURVEY_TRANSITIONS.restore.toStatus).toBe('draft');
  });

  it('delete fromStatuses includes both draft and archived', () => {
    expect(SURVEY_TRANSITIONS.delete.fromStatuses).toContain('draft');
    expect(SURVEY_TRANSITIONS.delete.fromStatuses).toContain('archived');
  });
});

// ── SURVEY_ACTION_UI ────────────────────────────────────────────────

describe('SURVEY_ACTION_UI', () => {
  it('has UI config for every action in SURVEY_TRANSITIONS', () => {
    for (const action of Object.keys(SURVEY_TRANSITIONS)) {
      expect(SURVEY_ACTION_UI[action as keyof typeof SURVEY_ACTION_UI]).toBeDefined();
    }
  });

  it('restore has default confirm dialog', () => {
    expect(SURVEY_ACTION_UI.restore.confirm?.variant).toBe('default');
  });

  it('delete has destructive confirm dialog', () => {
    expect(SURVEY_ACTION_UI.delete.confirm?.variant).toBe('destructive');
  });
});
