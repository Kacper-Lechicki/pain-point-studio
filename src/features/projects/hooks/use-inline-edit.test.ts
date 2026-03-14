// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInlineEdit } from './use-inline-edit';

vi.mock('@/features/projects/config', () => ({
  SAVE_STATUS_FEEDBACK_MS: 2_000,
}));

// ── useInlineEdit ───────────────────────────────────────────────────

describe('useInlineEdit', () => {
  it('starts with isEditing false and idle status', () => {
    const { result } = renderHook(() => useInlineEdit({ currentValue: 'Hello', persist: vi.fn() }));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.draft).toBe('Hello');
  });

  it('startEditing sets isEditing and draft', () => {
    const { result } = renderHook(() => useInlineEdit({ currentValue: 'Hello', persist: vi.fn() }));

    act(() => result.current.startEditing());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.draft).toBe('Hello');
  });

  it('cancel resets draft and exits editing', () => {
    const { result } = renderHook(() => useInlineEdit({ currentValue: 'Hello', persist: vi.fn() }));

    act(() => result.current.startEditing());
    act(() => result.current.setDraft('Changed'));
    act(() => result.current.cancel());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.draft).toBe('Hello');
    expect(result.current.saveStatus).toBe('idle');
  });

  it('save with no change just exits editing', async () => {
    const persist = vi.fn();

    const { result } = renderHook(() => useInlineEdit({ currentValue: 'Hello', persist }));

    act(() => result.current.startEditing());

    await act(() => result.current.save());

    expect(result.current.isEditing).toBe(false);
    expect(persist).not.toHaveBeenCalled();
  });

  it('save calls persist and updates status to saved', async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();

    const { result } = renderHook(() => useInlineEdit({ currentValue: 'Hello', persist, onSaved }));

    act(() => result.current.startEditing());
    act(() => result.current.setDraft('Updated'));

    await act(() => result.current.save());

    expect(persist).toHaveBeenCalledWith('Updated');
    expect(onSaved).toHaveBeenCalledWith('Updated');
    expect(result.current.isEditing).toBe(false);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('save with error sets status to failed', async () => {
    const persist = vi.fn().mockResolvedValue(true);

    const { result } = renderHook(() => useInlineEdit({ currentValue: 'Hello', persist }));

    act(() => result.current.startEditing());
    act(() => result.current.setDraft('Updated'));

    await act(() => result.current.save());

    expect(result.current.saveStatus).toBe('failed');
    expect(result.current.isEditing).toBe(true);
  });
});
