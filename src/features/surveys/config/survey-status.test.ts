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
  const statuses: SurveyStatus[] = [
    'draft',
    'active',
    'completed',
    'cancelled',
    'archived',
    'trashed',
  ];

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

  it('should allow reopening a completed survey', () => {
    expect(canTransition('completed', 'reopen')).toBe(true);
  });

  it('should allow reopening a cancelled survey', () => {
    expect(canTransition('cancelled', 'reopen')).toBe(true);
  });

  it('should not allow reopening a draft', () => {
    expect(canTransition('draft', 'reopen')).toBe(false);
  });

  it('should not allow reopening an active survey', () => {
    expect(canTransition('active', 'reopen')).toBe(false);
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

  it('should allow trashing a draft', () => {
    expect(canTransition('draft', 'trash')).toBe(true);
  });

  it('should allow trashing an active survey', () => {
    expect(canTransition('active', 'trash')).toBe(true);
  });

  it('should allow trashing a completed survey', () => {
    expect(canTransition('completed', 'trash')).toBe(true);
  });

  it('should allow trashing a cancelled survey', () => {
    expect(canTransition('cancelled', 'trash')).toBe(true);
  });

  it('should allow trashing an archived survey', () => {
    expect(canTransition('archived', 'trash')).toBe(true);
  });

  it('should not allow trashing a trashed survey', () => {
    expect(canTransition('trashed', 'trash')).toBe(false);
  });

  it('should allow restoring from trash for a trashed survey', () => {
    expect(canTransition('trashed', 'restoreTrash')).toBe(true);
  });

  it('should not allow restoring from trash for an active survey', () => {
    expect(canTransition('active', 'restoreTrash')).toBe(false);
  });

  it('should allow permanent delete for a trashed survey', () => {
    expect(canTransition('trashed', 'permanentDelete')).toBe(true);
  });

  it('should not allow permanent delete for a draft', () => {
    expect(canTransition('draft', 'permanentDelete')).toBe(false);
  });

  it('should not allow permanent delete for an active survey', () => {
    expect(canTransition('active', 'permanentDelete')).toBe(false);
  });
});

// ── getAvailableActions ─────────────────────────────────────────────

describe('getAvailableActions', () => {
  it('should allow archiving or trashing a draft', () => {
    const actions = getAvailableActions('draft');

    expect(actions).toContain('archive');
    expect(actions).toContain('trash');
    expect(actions).not.toContain('complete');
  });

  it('should allow completing, cancelling, or trashing an active survey', () => {
    const actions = getAvailableActions('active');

    expect(actions).toContain('complete');
    expect(actions).toContain('cancel');
    expect(actions).toContain('trash');
  });

  it('should allow restoring or trashing an archived survey', () => {
    const actions = getAvailableActions('archived');

    expect(actions).toContain('restore');
    expect(actions).toContain('trash');
  });

  it('should allow reopening, archiving, or trashing a completed survey', () => {
    const actions = getAvailableActions('completed');

    expect(actions).toContain('reopen');
    expect(actions).toContain('archive');
    expect(actions).toContain('trash');
  });

  it('should allow reopening, archiving, or trashing a cancelled survey', () => {
    const actions = getAvailableActions('cancelled');

    expect(actions).toContain('reopen');
    expect(actions).toContain('archive');
    expect(actions).toContain('trash');
  });

  it('should allow restoreTrash or permanentDelete for a trashed survey', () => {
    const actions = getAvailableActions('trashed');

    expect(actions).toContain('restoreTrash');
    expect(actions).toContain('permanentDelete');
    expect(actions).toHaveLength(2);
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

  it('should set isTrashed for trashed status', () => {
    const flags = deriveSurveyFlags('trashed');

    expect(flags.isTrashed).toBe(true);
    expect(flags.isDraft).toBe(false);
    expect(flags.isActive).toBe(false);
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

  it('should use method "delete" for permanentDelete', () => {
    expect(SURVEY_TRANSITIONS.permanentDelete.method).toBe('delete');
  });

  it('should use method "update" for complete', () => {
    expect(SURVEY_TRANSITIONS.complete.method).toBe('update');
  });

  it('should use method "update" for trash', () => {
    expect(SURVEY_TRANSITIONS.trash.method).toBe('update');
  });

  it('should use method "update" for restoreTrash', () => {
    expect(SURVEY_TRANSITIONS.restoreTrash.method).toBe('update');
  });

  it('should use method "update" for reopen', () => {
    expect(SURVEY_TRANSITIONS.reopen.method).toBe('update');
  });
});

describe('SURVEY_TRANSITIONS – restore and trash targets', () => {
  it('should have restore toStatus as null (restores to previous_status)', () => {
    expect(SURVEY_TRANSITIONS.restore.toStatus).toBeNull();
  });

  it('should have trash toStatus as trashed', () => {
    expect(SURVEY_TRANSITIONS.trash.toStatus).toBe('trashed');
  });

  it('should allow trashing from all non-trashed statuses', () => {
    expect(SURVEY_TRANSITIONS.trash.fromStatuses).toContain('draft');
    expect(SURVEY_TRANSITIONS.trash.fromStatuses).toContain('active');
    expect(SURVEY_TRANSITIONS.trash.fromStatuses).toContain('completed');
    expect(SURVEY_TRANSITIONS.trash.fromStatuses).toContain('cancelled');
    expect(SURVEY_TRANSITIONS.trash.fromStatuses).toContain('archived');
  });

  it('should only allow permanent delete from trashed', () => {
    expect(SURVEY_TRANSITIONS.permanentDelete.fromStatuses).toEqual(['trashed']);
  });

  it('should have restoreTrash toStatus as null (restores to pre_trash_status)', () => {
    expect(SURVEY_TRANSITIONS.restoreTrash.toStatus).toBeNull();
  });

  it('should have reopen toStatus as active', () => {
    expect(SURVEY_TRANSITIONS.reopen.toStatus).toBe('active');
  });

  it('should allow reopening from completed and cancelled', () => {
    expect(SURVEY_TRANSITIONS.reopen.fromStatuses).toContain('completed');
    expect(SURVEY_TRANSITIONS.reopen.fromStatuses).toContain('cancelled');
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

  it('should have destructive confirm dialog for trash', () => {
    expect(SURVEY_ACTION_UI.trash.confirm?.variant).toBe('destructive');
  });

  it('should have destructive confirm dialog for permanentDelete', () => {
    expect(SURVEY_ACTION_UI.permanentDelete.confirm?.variant).toBe('destructive');
  });

  it('should have default confirm dialog for restoreTrash', () => {
    expect(SURVEY_ACTION_UI.restoreTrash.confirm?.variant).toBe('default');
  });

  it('should have default confirm dialog for reopen', () => {
    expect(SURVEY_ACTION_UI.reopen.confirm?.variant).toBe('default');
  });

  it('should not have a "delete" key', () => {
    expect('delete' in SURVEY_ACTION_UI).toBe(false);
  });

  it('should have reopen, trash, restoreTrash, and permanentDelete keys', () => {
    expect('reopen' in SURVEY_ACTION_UI).toBe(true);
    expect('trash' in SURVEY_ACTION_UI).toBe(true);
    expect('restoreTrash' in SURVEY_ACTION_UI).toBe(true);
    expect('permanentDelete' in SURVEY_ACTION_UI).toBe(true);
  });
});
