// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { JSONContent } from '@tiptap/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNoteAutoSave } from './use-note-auto-save';

const mockUpdateProjectNote = vi.fn();
const mockExtractTitle = vi.fn().mockReturnValue('Extracted Title');

vi.mock('@/features/projects/actions/update-project-note', () => ({
  updateProjectNote: (...args: unknown[]) => mockUpdateProjectNote(...args),
}));

vi.mock('@/features/projects/lib/note-helpers', () => ({
  extractTitleFromTiptap: (...args: unknown[]) => mockExtractTitle(...args),
}));

vi.mock('@/features/projects/config', () => ({
  NOTE_CONTENT_DEBOUNCE_MS: 500,
}));

const sampleContent: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
};

describe('useNoteAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUpdateProjectNote.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with idle status', () => {
    const { result } = renderHook(() => useNoteAutoSave({ noteId: 'n1' }));

    expect(result.current.saveStatus).toBe('idle');
  });

  it('sets status to pending when content changes', () => {
    const { result } = renderHook(() => useNoteAutoSave({ noteId: 'n1' }));

    act(() => result.current.handleContentChange(sampleContent));

    expect(result.current.saveStatus).toBe('pending');
  });

  it('transitions to saving then saved after debounce', async () => {
    const { result } = renderHook(() => useNoteAutoSave({ noteId: 'n1' }));

    act(() => result.current.handleContentChange(sampleContent));

    expect(result.current.saveStatus).toBe('pending');

    // Advance past debounce and flush async save
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.saveStatus).toBe('saved');

    expect(mockUpdateProjectNote).toHaveBeenCalledWith({
      noteId: 'n1',
      content: sampleContent,
    });
  });

  it('sets status to failed on save error', async () => {
    mockUpdateProjectNote.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useNoteAutoSave({ noteId: 'n1' }));

    act(() => result.current.handleContentChange(sampleContent));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.saveStatus).toBe('failed');
  });

  it('debounces rapid changes — only saves the last one', async () => {
    const { result } = renderHook(() => useNoteAutoSave({ noteId: 'n1' }));

    act(() => result.current.handleContentChange({ type: 'doc', content: [] }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    act(() => result.current.handleContentChange(sampleContent));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.saveStatus).toBe('saved');

    // Only one save call, with the last content
    expect(mockUpdateProjectNote).toHaveBeenCalledTimes(1);
    expect(mockUpdateProjectNote).toHaveBeenCalledWith({
      noteId: 'n1',
      content: sampleContent,
    });
  });

  it('resets to idle when noteId changes', () => {
    const { result, rerender } = renderHook(({ noteId }) => useNoteAutoSave({ noteId }), {
      initialProps: { noteId: 'n1' as string | null },
    });

    act(() => result.current.handleContentChange(sampleContent));

    expect(result.current.saveStatus).toBe('pending');

    rerender({ noteId: 'n2' });

    expect(result.current.saveStatus).toBe('idle');
  });

  it('does not save when noteId is null', () => {
    const { result } = renderHook(() => useNoteAutoSave({ noteId: null }));

    act(() => result.current.handleContentChange(sampleContent));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUpdateProjectNote).not.toHaveBeenCalled();
  });

  it('calls onTitleExtracted with extracted title', async () => {
    const onTitleExtracted = vi.fn();

    const { result } = renderHook(() => useNoteAutoSave({ noteId: 'n1', onTitleExtracted }));

    act(() => result.current.handleContentChange(sampleContent));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(onTitleExtracted).toHaveBeenCalledWith('n1', 'Extracted Title');
  });

  it('clears pending timer on unmount', () => {
    const { result, unmount } = renderHook(() => useNoteAutoSave({ noteId: 'n1' }));

    act(() => result.current.handleContentChange(sampleContent));

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUpdateProjectNote).not.toHaveBeenCalled();
  });
});
