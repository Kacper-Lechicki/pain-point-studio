'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { RESPONSES_GROWTH_CONFIG, RESPONSES_GROWTH_DATA } from '@/config/marketing';

const formatDayTick = (value: string): string => value.slice(0, 3);

export function ResponsesGrowthChart() {
  return (
    <Card className="flex h-full w-full flex-col border-0 bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Response Velocity</CardTitle>
        <CardDescription>Daily responses collected</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          id="responses-growth"
          config={RESPONSES_GROWTH_CONFIG}
          className="aspect-auto h-full w-full"
        >
          <AreaChart
            accessibilityLayer
            data={RESPONSES_GROWTH_DATA}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={RESPONSES_GROWTH_CONFIG.visitors.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={RESPONSES_GROWTH_CONFIG.visitors.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDayTick}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />

            <Area
              dataKey="visitors"
              type="natural"
              fill="url(#fillVisitors)"
              stroke={RESPONSES_GROWTH_CONFIG.visitors.color}
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
