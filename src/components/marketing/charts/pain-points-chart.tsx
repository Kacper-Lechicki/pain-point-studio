'use client';

import { useState } from 'react';

import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ChartDataPoint {
  painPoint: string;
  intensity: number;
  fill: string;
}

const chartData: ChartDataPoint[] = [
  { painPoint: 'Price', intensity: 45, fill: '#22c55e' },
  { painPoint: 'Speed', intensity: 80, fill: '#ef4444' },
  { painPoint: 'UX', intensity: 65, fill: '#a855f7' },
  { painPoint: 'Support', intensity: 30, fill: '#3b82f6' },
];

const chartConfig = {
  price: {
    label: 'Price High',
    color: '#22c55e',
  },
  speed: {
    label: 'Slow loading',
    color: '#ef4444',
  },
  ux: {
    label: 'Confusing UX',
    color: '#a855f7',
  },
  support: {
    label: 'Bad Support',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

const formatPainPointTick = (value: string): string => {
  const config = chartConfig[value.toLowerCase() as keyof typeof chartConfig];

  return config?.label.split(' ')[0] ?? value;
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
      radius={8}
      opacity={barOpacity}
      onMouseEnter={() => index !== undefined && onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    />
  );
}

export function PainPointsChart() {
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
        <CardTitle>Identified Pain Points</CardTitle>
        <CardDescription>Severity of user reported issues</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer id="pain-points" config={chartConfig} className="aspect-auto h-full w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="painPoint"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={formatPainPointTick}
            />

            <ChartTooltip
              cursor={false}
              content={isBarHovered ? <ChartTooltipContent hideLabel /> : () => null}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <Bar
              dataKey="intensity"
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
