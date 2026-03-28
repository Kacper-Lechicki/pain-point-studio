'use client';

import { useMemo } from 'react';

import { Monitor, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import type { DeviceTimelinePoint } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

interface OverviewDeviceSplitProps {
  deviceTimeline: DeviceTimelinePoint[];
}

export function OverviewDeviceSplit({ deviceTimeline }: OverviewDeviceSplitProps) {
  const t = useTranslations();

  const totals = useMemo(() => {
    const desktop = deviceTimeline.reduce((sum, p) => sum + p.desktop, 0);
    const mobile = deviceTimeline.reduce((sum, p) => sum + p.mobile, 0);
    const total = desktop + mobile;

    return {
      desktop,
      mobile,
      desktopPct: total > 0 ? Math.round((desktop / total) * 100) : 0,
      mobilePct: total > 0 ? Math.round((mobile / total) * 100) : 0,
      total,
    };
  }, [deviceTimeline]);

  const devices = [
    {
      label: t('surveys.stats.overview.desktop' as MessageKey),
      pct: totals.desktopPct,
      color: 'bg-chart-violet',
      icon: Monitor,
    },
    {
      label: t('surveys.stats.overview.mobile' as MessageKey),
      pct: totals.mobilePct,
      color: 'bg-chart-cyan',
      icon: Smartphone,
    },
  ];

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-0 flex-col gap-2 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('surveys.stats.overview.deviceSplit' as MessageKey)}
          </p>
        </div>

        {totals.total === 0 ? (
          <div className="flex h-[100px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {t('surveys.stats.overview.noDeviceData' as MessageKey)}
            </p>
          </div>
        ) : (
          <div className="mt-1 flex flex-col gap-3">
            {devices.map((device) => (
              <div key={device.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <device.icon className="size-3" aria-hidden />
                    {device.label}
                  </span>
                  <span className="text-foreground text-xs font-semibold tabular-nums">
                    {device.pct}%
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={`${device.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${device.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
