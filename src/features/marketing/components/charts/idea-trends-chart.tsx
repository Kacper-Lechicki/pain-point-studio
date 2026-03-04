'use client';

import { useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  IDEA_TRENDS_CONFIG,
  IDEA_TRENDS_DATA,
  localizeChartConfig,
} from '@/features/marketing/config';

const IdeaTrendsChart = () => {
  const t = useTranslations();

  const formatMonthTick = (value: string): string =>
    t(`marketing.charts.months.${value}` as Parameters<typeof t>[0]).slice(0, 3);
  const title = t('marketing.charts.ideaTrends.title');
  const description = t('marketing.charts.ideaTrends.description');

  const chartConfig = localizeChartConfig(IDEA_TRENDS_CONFIG, (key) =>
    t(`marketing.charts.ideaTrends.${key}` as Parameters<typeof t>[0])
  );

  return (
    <Card className="flex h-full w-full flex-col border-0 bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer id="idea-trends" config={chartConfig} className="aspect-auto h-full w-full">
          <LineChart
            accessibilityLayer
            data={IDEA_TRENDS_DATA}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatMonthTick}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Line
              dataKey="desktop"
              type="natural"
              stroke={chartConfig.desktop.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />

            <Line
              dataKey="mobile"
              type="natural"
              stroke={chartConfig.mobile.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export { IdeaTrendsChart };
