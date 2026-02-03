'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface BackgroundRippleEffectProps {
  rows?: number;
  cols?: number;
  cellSize?: number;
  className?: string;
}

interface ClickedCell {
  row: number;
  col: number;
}

const COMPONENT_NAME = 'Background' + 'Ripple' + 'Effect';

export const BackgroundRippleEffect = memo(
  ({ rows = 8, cols = 27, cellSize = 56, className }: BackgroundRippleEffectProps) => {
    const [clickedCell, setClickedCell] = useState<ClickedCell | null>(null);
    const [rippleKey, setRippleKey] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);

      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleCellClick = useCallback((row: number, col: number) => {
      setClickedCell({ row, col });
      setRippleKey((k: number) => k + 1);
    }, []);

    const optimizedRows = isMobile ? Math.min(rows, 12) : Math.min(rows, 24);
    const optimizedCols = isMobile ? Math.min(cols, 12) : Math.min(cols, 24);
    const optimizedCellSize = cellSize * (cols / optimizedCols);

    return (
      <div
        ref={ref}
        className={cn(
          'absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden contain-layout contain-paint',
          '[--cell-border-color:var(--color-neutral-300)] [--cell-fill-color:var(--color-neutral-100)] [--cell-shadow-color:var(--color-neutral-500)]',
          'dark:[--cell-border-color:var(--color-neutral-700)] dark:[--cell-fill-color:var(--color-neutral-900)] dark:[--cell-shadow-color:var(--color-neutral-800)]',
          className
        )}
      >
        <div className="relative">
          <DivGrid
            key={`base-${rippleKey}`}
            className="mask-[radial-gradient(ellipse_at_center,black_20%,transparent_65%)] opacity-70"
            rows={optimizedRows}
            cols={optimizedCols}
            cellSize={optimizedCellSize}
            borderColor="var(--cell-border-color)"
            fillColor="var(--cell-fill-color)"
            clickedCell={clickedCell}
            onCellClick={handleCellClick}
            interactive
          />
        </div>
      </div>
    );
  }
);

BackgroundRippleEffect.displayName = COMPONENT_NAME;

interface DivGridProps {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: ClickedCell | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
}

type CellStyle = React.CSSProperties & {
  ['--delay']?: string;
  ['--duration']?: string;
};

const DivGrid = memo(
  ({
    className,
    rows = 7,
    cols = 30,
    cellSize = 56,
    borderColor = '#3f3f46',
    fillColor = 'rgba(14,165,233,0.3)',
    clickedCell = null,
    onCellClick = () => {},
    interactive = true,
  }: DivGridProps) => {
    const cells = useMemo(
      () => Array.from({ length: rows * cols }, (_: unknown, idx: number) => idx),
      [rows, cols]
    );

    const gridStyle: React.CSSProperties = useMemo(
      () => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: cols * cellSize,
        height: rows * cellSize,
        marginInline: 'auto',
        contain: 'strict',
      }),
      [rows, cols, cellSize]
    );

    const cellsData = useMemo(() => {
      return cells.map((idx: number) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;

        return { idx, rowIdx, colIdx };
      });
    }, [cells, cols]);

    return (
      <div className={cn('relative z-3', className)} style={gridStyle}>
        {cellsData.map(({ idx, rowIdx, colIdx }) => {
          const distance = clickedCell
            ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
            : 0;

          const delay = clickedCell ? Math.max(0, distance * 55) : 0;
          const duration = 200 + distance * 80;

          const cellStyle: CellStyle = clickedCell
            ? {
                '--delay': `${delay}ms`,
                '--duration': `${duration}ms`,
              }
            : {};

          return (
            <div
              key={idx}
              className={cn(
                'cell relative border-[0.5px] opacity-40 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset]',
                'transform-gpu transition-[transform,opacity] duration-150 hover:opacity-80',
                clickedCell && 'animate-cell-ripple fill-mode-[none]',
                !interactive && 'pointer-events-none'
              )}
              style={{
                backgroundColor: fillColor,
                borderColor: borderColor,
                contain: 'strict',
                ...cellStyle,
              }}
              onClick={interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined}
            />
          );
        })}
      </div>
    );
  }
);

const GRID_COMPONENT_NAME = 'DivGrid';
DivGrid.displayName = GRID_COMPONENT_NAME;
