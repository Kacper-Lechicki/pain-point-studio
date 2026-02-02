'use client';

import { useState } from 'react';

import { Bar, BarChart, Rectangle, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ChartDataPoint {
  activity: string;
  count: number;
  fill: string;
}

const chartData: ChartDataPoint[] = [
  { activity: 'form_fill', count: 320, fill: '#e11d48' },
  { activity: 'scroll', count: 450, fill: '#f59e0b' },
  { activity: 'click', count: 580, fill: '#10b981' },
  { activity: 'view', count: 890, fill: '#3b82f6' },
];

const chartConfig = {
  view: {
    label: 'View',
    color: '#3b82f6',
  },
  click: {
    label: 'Click',
    color: '#10b981',
  },
  scroll: {
    label: 'Scroll',
    color: '#f59e0b',
  },
  form_fill: {
    label: 'Form Fill',
    color: '#e11d48',
  },
} satisfies ChartConfig;

const formatActivityTick = (value: string): string => {
  return chartConfig[value as keyof typeof chartConfig]?.label ?? value;
};

interface CustomBarProps {
  fill?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  isBarHovered: boolean;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
}

function CustomBar(props: CustomBarProps) {
  const {
    fill,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index,
    activeIndex,
    isBarHovered,
    onMouseEnter,
    onMouseLeave,
  } = props;

  const barOpacity = activeIndex === index && isBarHovered ? 0.8 : 1;

  return (
    <Rectangle
      fill={fill}
      x={x}
      y={y}
      width={width}
      height={height}
      radius={5}
      opacity={barOpacity}
      onMouseEnter={() => index !== undefined && onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    />
  );
}

export function QuestionEngagementChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isBarHovered, setIsBarHovered] = useState(false);

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
    setIsBarHovered(true);
  };

  const handleMouseLeave = () => {
    setIsBarHovered(false);
    setActiveIndex(null);
  };

  return (
    <Card className="flex h-full w-full flex-col border-0 bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Engagement Metrics</CardTitle>
        <CardDescription>Interaction types by frequency</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          id="question-engagement"
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <BarChart
            data={chartData}
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
            <ChartTooltip
              cursor={false}
              content={isBarHovered ? <ChartTooltipContent hideLabel /> : () => null}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <Bar
              dataKey="count"
              layout="vertical"
              shape={
                <CustomBar
                  activeIndex={activeIndex}
                  isBarHovered={isBarHovered}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              }
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
