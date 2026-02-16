'use client';

import { useTranslations } from 'next-intl';

import type { DeviceTimelinePoint } from '@/features/surveys/actions/get-survey-stats';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { DeviceBreakdownChart } from '@/features/surveys/components/stats/device-breakdown-chart';
import { ResponseTimelineChart } from '@/features/surveys/components/stats/response-timeline-chart';

interface SurveyStatsChartsProps {
  responseTimeline: number[];
  deviceTimeline: DeviceTimelinePoint[];
}

export function SurveyStatsCharts({ responseTimeline, deviceTimeline }: SurveyStatsChartsProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <SectionLabel>{t('surveys.stats.responseTimeline')}</SectionLabel>
        <ResponseTimelineChart data={responseTimeline} className="h-48 w-full" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {t('surveys.stats.deviceBreakdown')}
          </p>
          <div className="flex items-center gap-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-violet)' }}
              />
              {t('surveys.stats.deviceDesktop')}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-cyan)' }}
              />
              {t('surveys.stats.deviceMobile')}
            </span>
          </div>
        </div>
        <DeviceBreakdownChart data={deviceTimeline} className="h-48 w-full" />
      </div>
    </div>
  );
}
