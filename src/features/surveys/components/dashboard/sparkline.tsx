import { useId } from 'react';

import {
  SPARKLINE_SHARPLY_DECLINING_THRESHOLD,
  SPARKLINE_VIEWBOX_HEIGHT,
  SPARKLINE_VIEWBOX_WIDTH,
} from '@/features/surveys/config';
import { cn } from '@/lib/common/utils';

type SparklineTrend = 'rising' | 'declining' | 'sharply-declining' | 'flat';

const TREND_COLOR: Record<SparklineTrend, string> = {
  rising: 'text-emerald-500',
  declining: 'text-amber-500',
  'sharply-declining': 'text-red-500',
  flat: 'text-muted-foreground',
};

/**
 * Analyze the trend of a data series by comparing the average of
 * the second half to the first half. Returns a semantic trend label.
 */
export function getSparklineTrend(data: number[]): SparklineTrend {
  const total = data.reduce((s, v) => s + v, 0);

  if (total === 0) {
    return 'flat';
  }

  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid);
  const secondHalf = data.slice(mid);

  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / (firstHalf.length || 1);
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / (secondHalf.length || 1);

  if (avgFirst === 0) {
    return avgSecond > 0 ? 'rising' : 'flat';
  }

  const change = (avgSecond - avgFirst) / avgFirst;

  if (change >= 0) {
    return 'rising';
  }

  if (change > SPARKLINE_SHARPLY_DECLINING_THRESHOLD) {
    return 'declining';
  }

  return 'sharply-declining';
}

/**
 * Returns the Tailwind color class for a given data series based on trend.
 */
export function getSparklineColor(data: number[]): string {
  return TREND_COLOR[getSparklineTrend(data)];
}

interface SparklineProps {
  data: number[];
  className?: string;
}

/**
 * Pure-SVG micro sparkline chart. Renders a 14-point polyline
 * from an array of numbers (daily response counts) with a subtle
 * gradient fill beneath the line for visual weight.
 * When all values are zero, renders a flat horizontal line.
 */
export function Sparkline({ data, className }: SparklineProps) {
  const gradientId = useId();
  const max = Math.max(...data, 0);

  if (!data.length) {
    return <span className={cn('inline-block h-5 w-16', className)} />;
  }

  const h = SPARKLINE_VIEWBOX_HEIGHT;
  const w = SPARKLINE_VIEWBOX_WIDTH;
  const step = w / (data.length - 1);

  // Flat line when all zeros
  if (max === 0) {
    const y = h - 1;

    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={cn('h-5 w-16 shrink-0', className)}
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1="0"
          y1={y}
          x2={w}
          y2={y}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  const linePoints = data.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`).join(' ');

  // Area path: same points, then close to bottom-right → bottom-left
  const areaPath = data
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 2) - 1;

      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const closedArea = `${areaPath} L${w},${h} L0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('h-5 w-16 shrink-0', className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={closedArea} fill={`url(#${gradientId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
