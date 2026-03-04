'use client';

import { useId, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { SparklinePoint } from '@/features/projects/actions/get-projects-list-extras';
import { cn } from '@/lib/common/utils';

interface ActivitySparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  /** When true, SVG uses width="100%" to fill container; otherwise uses fixed width. */
  fillWidth?: boolean;
  className?: string;
}

export function ActivitySparkline({
  data,
  width = 120,
  height = 28,
  fillWidth = false,
  className,
}: ActivitySparklineProps) {
  const t = useTranslations();
  const uniqueId = useId();
  const gradientId = `spark-${uniqueId.replace(/:/g, '')}`;

  const { pathD, areaD, hasData, total } = useMemo(() => {
    const counts = data.map((d) => d.count);
    const sum = counts.reduce((a, b) => a + b, 0);

    if (sum === 0 || counts.length < 2) {
      return { pathD: '', areaD: '', hasData: false, total: 0 };
    }

    const max = Math.max(...counts);
    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const step = chartW / (counts.length - 1);

    const points = counts.map((c, i) => ({
      x: padding + i * step,
      y: padding + chartH - (max > 0 ? (c / max) * chartH : 0),
    }));

    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const last = points[points.length - 1]!;
    const area = `${line} L${last.x.toFixed(1)},${(height - padding).toFixed(1)} L${padding.toFixed(1)},${(height - padding).toFixed(1)} Z`;

    return { pathD: line, areaD: area, hasData: true, total: sum };
  }, [data, width, height]);

  const viewBox = `0 0 ${width} ${height}`;
  const svgProps = {
    height,
    viewBox,
    preserveAspectRatio: 'none' as const,
    className: cn(className),
  };

  const svgWidth = fillWidth ? '100%' : width;

  if (!hasData) {
    const y = height - 1;

    return (
      <svg
        width={svgWidth}
        aria-hidden
        {...svgProps}
        className={cn('text-muted-foreground', className)}
      >
        <line
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return (
    <svg
      width={svgWidth}
      {...svgProps}
      role="img"
      aria-label={t('projects.aria.sparklineResponses', { total })}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke="rgb(16 185 129)" strokeWidth={1.5} />
    </svg>
  );
}
