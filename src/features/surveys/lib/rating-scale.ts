/** Parsed rating scale configuration with pre-computed values array. */
interface RatingScaleConfig {
  min: number;
  max: number;
  values: number[];
  minLabel: string;
  maxLabel: string;
}

export function getRatingScaleConfig(config: Record<string, unknown>): RatingScaleConfig {
  const min = (config.min as number) ?? 1;
  const max = (config.max as number) ?? 5;

  return {
    min,
    max,
    values: Array.from({ length: max - min + 1 }, (_, i) => min + i),
    minLabel: (config.minLabel as string) ?? '',
    maxLabel: (config.maxLabel as string) ?? '',
  };
}
