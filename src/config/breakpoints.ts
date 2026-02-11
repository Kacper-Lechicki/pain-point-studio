export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  dashboard: 1400,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
