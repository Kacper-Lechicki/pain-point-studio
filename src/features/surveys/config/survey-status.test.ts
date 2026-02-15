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
  const statuses: SurveyStatus[] = [
    'draft',
    'pending',
    'active',
    'closed',
    'cancelled',
    'archived',
  ];

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

  it('only "active" has showPulseDot enabled', () => {
    expect(SURVEY_STATUS_CONFIG.active.badge.showPulseDot).toBe(true);
    expect(SURVEY_STATUS_CONFIG.draft.badge.showPulseDot).toBe(false);
    expect(SURVEY_STATUS_CONFIG.closed.badge.showPulseDot).toBe(false);
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

  it('allows cancelling a pending survey', () => {
    expect(canTransition('pending', 'cancel')).toBe(true);
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

  it('archived can only be restored', () => {
    const actions = getAvailableActions('archived');

    expect(actions).toEqual(['restore']);
  });

  it('closed can only be archived', () => {
    const actions = getAvailableActions('closed');

    expect(actions).toEqual(['archive']);
  });

  it('pending can only be cancelled', () => {
    const actions = getAvailableActions('pending');

    expect(actions).toEqual(['cancel']);
  });
});

// ── deriveSurveyFlags ───────────────────────────────────────────────

describe('deriveSurveyFlags', () => {
  it('sets isDraft for draft status', () => {
    const flags = deriveSurveyFlags('draft');

    expect(flags.isDraft).toBe(true);
    expect(flags.isActive).toBe(false);
    expect(flags.canDuplicate).toBe(true);
  });

  it('sets isActive for active status', () => {
    const flags = deriveSurveyFlags('active');

    expect(flags.isActive).toBe(true);
    expect(flags.isDraft).toBe(false);
    expect(flags.canDuplicate).toBe(true);
  });

  it('sets isArchived for archived status', () => {
    const flags = deriveSurveyFlags('archived');

    expect(flags.isArchived).toBe(true);
    expect(flags.canDuplicate).toBe(false);
  });

  it('canDuplicate is true for draft, active, closed, cancelled', () => {
    expect(deriveSurveyFlags('draft').canDuplicate).toBe(true);
    expect(deriveSurveyFlags('active').canDuplicate).toBe(true);
    expect(deriveSurveyFlags('closed').canDuplicate).toBe(true);
    expect(deriveSurveyFlags('cancelled').canDuplicate).toBe(true);
  });

  it('canDuplicate is false for pending and archived', () => {
    expect(deriveSurveyFlags('pending').canDuplicate).toBe(false);
    expect(deriveSurveyFlags('archived').canDuplicate).toBe(false);
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

// ── SURVEY_ACTION_UI ────────────────────────────────────────────────

describe('SURVEY_ACTION_UI', () => {
  it('has UI config for every action in SURVEY_TRANSITIONS', () => {
    for (const action of Object.keys(SURVEY_TRANSITIONS)) {
      expect(SURVEY_ACTION_UI[action as keyof typeof SURVEY_ACTION_UI]).toBeDefined();
    }
  });

  it('restore has no confirm dialog', () => {
    expect(SURVEY_ACTION_UI.restore.confirm).toBeUndefined();
  });

  it('delete has destructive confirm dialog', () => {
    expect(SURVEY_ACTION_UI.delete.confirm?.variant).toBe('destructive');
  });
});
