import { describe, expect, it, vi } from 'vitest';

import type { ChartConfig } from '@/components/ui/chart';

import { localizeChartConfig } from './charts';

describe('localizeChartConfig', () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  it('translates label via chart.{label} key', () => {
    const config = {
      visitors: { label: 'visitors', color: 'var(--pink)' },
    };

    const result = localizeChartConfig(config, t);

    expect(t).toHaveBeenCalledWith('chart.visitors');
    expect(result.visitors.label).toBe('translated:chart.visitors');
  });

  it('preserves non-label properties', () => {
    const config = {
      visitors: { label: 'visitors', color: 'var(--pink)' },
    };

    const result = localizeChartConfig(config, t);

    expect(result.visitors.color).toBe('var(--pink)');
  });

  it('skips entries without label', () => {
    const config: ChartConfig = {
      noLabel: { color: 'var(--blue)' },
    };

    const result = localizeChartConfig(config, t);
    const noLabelEntry = result.noLabel;

    expect(noLabelEntry?.label).toBeUndefined();
  });

  it('handles multiple entries', () => {
    const config = {
      desktop: { label: 'desktop', color: 'var(--violet)' },
      mobile: { label: 'mobile', color: 'var(--cyan)' },
    };

    const result = localizeChartConfig(config, t);

    expect(result.desktop.label).toBe('translated:chart.desktop');
    expect(result.mobile.label).toBe('translated:chart.mobile');
  });
});
