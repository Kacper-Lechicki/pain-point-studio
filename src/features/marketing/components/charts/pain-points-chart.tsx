'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  PAIN_POINTS_CONFIG,
  PAIN_POINTS_DATA,
  localizeChartConfig,
} from '@/features/marketing/config';

const PainPointsChart = () => {
  const t = useTranslations();
  const title = t('marketing.charts.painPoints.title');
  const description = t('marketing.charts.painPoints.description');

  const chartConfig = localizeChartConfig(PAIN_POINTS_CONFIG, (key) =>
    t(`marketing.charts.painPoints.${key}` as Parameters<typeof t>[0])
  );

  const formatPainPointTick = (value: string): string => {
    const config = chartConfig[value.toLowerCase() as keyof typeof chartConfig];

    return config?.label?.split(' ')[0] ?? value;
  };

  return (
    <Card className="flex h-full w-full flex-col border-0 bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer id="pain-points" config={chartConfig} className="aspect-auto h-full w-full">
          <BarChart data={PAIN_POINTS_DATA}>
            <XAxis
              dataKey="painPoint"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={formatPainPointTick}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            <Bar dataKey="intensity" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export { PainPointsChart };
