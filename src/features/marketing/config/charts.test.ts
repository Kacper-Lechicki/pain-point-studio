/** Tests for localizeChartConfig which translates chart labels via i18n keys. */
import { describe, expect, it, vi } from 'vitest';

import type { ChartConfig } from '@/components/ui/chart';

import { localizeChartConfig } from './charts';

describe('localizeChartConfig', () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  it('should translate label via chart.{label} key', () => {
    const config = {
      visitors: { label: 'visitors', color: 'var(--pink)' },
    };

    const result = localizeChartConfig(config, t);

    expect(t).toHaveBeenCalledWith('chart.visitors');
    expect(result.visitors.label).toBe('translated:chart.visitors');
  });

  it('should preserve non-label properties', () => {
    const config = {
      visitors: { label: 'visitors', color: 'var(--pink)' },
    };

    const result = localizeChartConfig(config, t);

    expect(result.visitors.color).toBe('var(--pink)');
  });

  it('should skip entries without label', () => {
    const config: ChartConfig = {
      noLabel: { color: 'var(--blue)' },
    };

    const result = localizeChartConfig(config, t);
    const noLabelEntry = result.noLabel;

    expect(noLabelEntry?.label).toBeUndefined();
  });

  it('should handle multiple entries', () => {
    const config = {
      desktop: { label: 'desktop', color: 'var(--violet)' },
      mobile: { label: 'mobile', color: 'var(--cyan)' },
    };

    const result = localizeChartConfig(config, t);

    expect(result.desktop.label).toBe('translated:chart.desktop');
    expect(result.mobile.label).toBe('translated:chart.mobile');
  });
});
