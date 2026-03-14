// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SubPanelItemsProvider, type SubPanelLink, useSubPanelItems } from './use-sub-panel-items';

const MockIcon = (() => null) as unknown as SubPanelLink['icon'];

const LINKS: SubPanelLink[] = [
  { label: 'Home', href: '/home', icon: MockIcon },
  { label: 'Settings', href: '/settings', icon: MockIcon },
];

const BOTTOM_LINKS: SubPanelLink[] = [{ label: 'Help', href: '/help', icon: MockIcon }];

function ContextReader() {
  const ctx = useSubPanelItems();
  const labels = ctx?.links.map((l) => l.label) ?? null;
  const bottomLabels = ctx?.bottomLinks.map((l) => l.label) ?? null;

  return <div data-testid="ctx">{JSON.stringify({ labels, bottomLabels })}</div>;
}

function ContextMutator() {
  const ctx = useSubPanelItems();

  return (
    <>
      <button data-testid="set-links" onClick={() => ctx?.setLinks(LINKS)} />
      <button data-testid="set-bottom" onClick={() => ctx?.setBottomLinks(BOTTOM_LINKS)} />
      <button
        data-testid="clear"
        onClick={() => {
          ctx?.setLinks([]);
          ctx?.setBottomLinks([]);
        }}
      />
    </>
  );
}

function readCtx() {
  return JSON.parse(screen.getByTestId('ctx').textContent ?? '{}');
}

describe('useSubPanelItems', () => {
  it('returns null without provider', () => {
    function NullReader() {
      const ctx = useSubPanelItems();

      return <div data-testid="ctx">{ctx === null ? 'null' : 'defined'}</div>;
    }

    render(<NullReader />);

    expect(screen.getByTestId('ctx').textContent).toBe('null');
  });

  it('returns initial empty arrays within provider', () => {
    render(
      <SubPanelItemsProvider>
        <ContextReader />
      </SubPanelItemsProvider>
    );

    expect(readCtx()).toEqual({ labels: [], bottomLabels: [] });
  });
});

describe('SubPanelItemsProvider – setLinks / setBottomLinks', () => {
  it('sets links', () => {
    render(
      <SubPanelItemsProvider>
        <ContextMutator />
        <ContextReader />
      </SubPanelItemsProvider>
    );

    act(() => screen.getByTestId('set-links').click());

    expect(readCtx().labels).toEqual(['Home', 'Settings']);
  });

  it('sets bottom links', () => {
    render(
      <SubPanelItemsProvider>
        <ContextMutator />
        <ContextReader />
      </SubPanelItemsProvider>
    );

    act(() => screen.getByTestId('set-bottom').click());

    expect(readCtx().bottomLabels).toEqual(['Help']);
  });

  it('clears all links', () => {
    render(
      <SubPanelItemsProvider>
        <ContextMutator />
        <ContextReader />
      </SubPanelItemsProvider>
    );

    act(() => screen.getByTestId('set-links').click());
    act(() => screen.getByTestId('set-bottom').click());

    expect(readCtx().labels).toEqual(['Home', 'Settings']);
    expect(readCtx().bottomLabels).toEqual(['Help']);

    act(() => screen.getByTestId('clear').click());

    expect(readCtx()).toEqual({ labels: [], bottomLabels: [] });
  });
});
