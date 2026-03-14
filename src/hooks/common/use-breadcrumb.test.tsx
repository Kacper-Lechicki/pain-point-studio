// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type BreadcrumbCrumb, BreadcrumbProvider, useBreadcrumbContext } from './use-breadcrumb';

function ContextReader() {
  const ctx = useBreadcrumbContext();

  return (
    <div data-testid="ctx">
      {JSON.stringify({ segments: ctx?.segments ?? null, customTrail: ctx?.customTrail ?? null })}
    </div>
  );
}

function ContextMutator() {
  const ctx = useBreadcrumbContext();

  return (
    <>
      <button data-testid="set" onClick={() => ctx?.setSegment('pid', 'My Project')} />
      <button data-testid="remove" onClick={() => ctx?.removeSegment('pid')} />
      <button
        data-testid="trail"
        onClick={() =>
          ctx?.setCustomTrail([
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
          ])
        }
      />
      <button data-testid="clear-trail" onClick={() => ctx?.setCustomTrail(null)} />
    </>
  );
}

function readCtx() {
  return JSON.parse(screen.getByTestId('ctx').textContent ?? '{}');
}

describe('useBreadcrumbContext', () => {
  it('returns null without provider', () => {
    function NullReader() {
      const ctx = useBreadcrumbContext();

      return <div data-testid="ctx">{ctx === null ? 'null' : 'defined'}</div>;
    }

    render(<NullReader />);

    expect(screen.getByTestId('ctx').textContent).toBe('null');
  });

  it('returns initial context within provider', () => {
    render(
      <BreadcrumbProvider>
        <ContextReader />
      </BreadcrumbProvider>
    );

    expect(readCtx()).toEqual({ segments: {}, customTrail: null });
  });
});

describe('BreadcrumbProvider – setSegment / removeSegment', () => {
  it('sets a segment', () => {
    render(
      <BreadcrumbProvider>
        <ContextMutator />
        <ContextReader />
      </BreadcrumbProvider>
    );

    act(() => screen.getByTestId('set').click());

    expect(readCtx().segments['pid']).toBe('My Project');
  });

  it('removes a segment', () => {
    render(
      <BreadcrumbProvider>
        <ContextMutator />
        <ContextReader />
      </BreadcrumbProvider>
    );

    act(() => screen.getByTestId('set').click());

    expect(readCtx().segments['pid']).toBe('My Project');

    act(() => screen.getByTestId('remove').click());

    expect(readCtx().segments['pid']).toBeUndefined();
  });

  it('does not update state when segment value is unchanged', () => {
    render(
      <BreadcrumbProvider>
        <ContextMutator />
        <ContextReader />
      </BreadcrumbProvider>
    );

    act(() => screen.getByTestId('set').click());

    const first = readCtx();

    act(() => screen.getByTestId('set').click());

    expect(readCtx()).toEqual(first);
  });

  it('removeSegment is a no-op when key does not exist', () => {
    render(
      <BreadcrumbProvider>
        <ContextMutator />
        <ContextReader />
      </BreadcrumbProvider>
    );

    act(() => screen.getByTestId('remove').click());

    expect(readCtx()).toEqual({ segments: {}, customTrail: null });
  });
});

describe('BreadcrumbProvider – custom trail', () => {
  it('sets a custom trail', () => {
    render(
      <BreadcrumbProvider>
        <ContextMutator />
        <ContextReader />
      </BreadcrumbProvider>
    );

    act(() => screen.getByTestId('trail').click());

    const expected: BreadcrumbCrumb[] = [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
    ];

    expect(readCtx().customTrail).toEqual(expected);
  });

  it('clears the custom trail', () => {
    render(
      <BreadcrumbProvider>
        <ContextMutator />
        <ContextReader />
      </BreadcrumbProvider>
    );

    act(() => screen.getByTestId('trail').click());

    expect(readCtx().customTrail).not.toBeNull();

    act(() => screen.getByTestId('clear-trail').click());

    expect(readCtx().customTrail).toBeNull();
  });
});
