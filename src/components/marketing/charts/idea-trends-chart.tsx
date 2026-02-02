'use client';

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ChartDataPoint {
  month: string;
  desktop: number;
  mobile: number;
}

const chartData: ChartDataPoint[] = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#8b5cf6',
  },
  mobile: {
    label: 'Mobile',
    color: '#06b6d4',
  },
} satisfies ChartConfig;

const formatMonthTick = (value: string): string => value.slice(0, 3);

export function IdeaTrendsChart() {
  return (
    <Card className="flex h-full w-full flex-col border-0 bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>Interest over last 6 months</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer id="idea-trends" config={chartConfig} className="aspect-auto h-full w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
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
}
