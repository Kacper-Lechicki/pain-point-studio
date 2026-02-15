'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  QUESTION_ENGAGEMENT_CONFIG,
  QUESTION_ENGAGEMENT_DATA,
  localizeChartConfig,
} from '@/features/marketing/config';

const QuestionEngagementChart = () => {
  const t = useTranslations();
  const title = t('marketing.charts.questionEngagement.title');
  const description = t('marketing.charts.questionEngagement.description');

  const chartConfig = localizeChartConfig(QUESTION_ENGAGEMENT_CONFIG, (key) =>
    t(`marketing.charts.questionEngagement.${key}` as Parameters<typeof t>[0])
  );

  const formatActivityTick = (value: string): string => {
    return chartConfig[value as keyof typeof chartConfig]?.label ?? value;
  };

  return (
    <Card className="flex h-full w-full flex-col border-0 bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          id="question-engagement"
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <BarChart
            data={QUESTION_ENGAGEMENT_DATA}
            layout="vertical"
            margin={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <YAxis
              dataKey="activity"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={formatActivityTick}
            />

            <XAxis dataKey="count" type="number" hide />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            <Bar dataKey="count" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export { QuestionEngagementChart };
