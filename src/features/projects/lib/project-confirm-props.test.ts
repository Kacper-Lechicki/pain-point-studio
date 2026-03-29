import { describe, expect, it } from 'vitest';

import type { ProjectAction } from '@/features/projects/config/status';

import { getProjectConfirmDialogProps } from './project-confirm-props';

// Identity translator — returns the key as-is
const t = (key: string) => key;

describe('getProjectConfirmDialogProps', () => {
  const actions: { action: ProjectAction; variant: string }[] = [
    { action: 'complete', variant: 'accent' },
    { action: 'trash', variant: 'destructive' },
    { action: 'restoreTrash', variant: 'default' },
    { action: 'permanentDelete', variant: 'destructive' },
  ];

  it.each(actions)('returns correct variant for $action', ({ action, variant }) => {
    const result = getProjectConfirmDialogProps(action, t as never);

    expect(result.variant).toBe(variant);
  });

  it.each(actions)('generates correct i18n keys for $action', ({ action }) => {
    const result = getProjectConfirmDialogProps(action, t as never);

    expect(result.title).toBe(`projects.list.confirm.${action}Title`);
    expect(result.description).toBe(`projects.list.confirm.${action}Description`);
    expect(result.confirmLabel).toBe(`projects.list.confirm.${action}Action`);
  });

  it('returns all required properties', () => {
    const result = getProjectConfirmDialogProps('trash', t as never);

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('confirmLabel');
    expect(result).toHaveProperty('variant');
  });
});
