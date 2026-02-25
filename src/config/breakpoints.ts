/**
 * Pixel breakpoints matching Tailwind's default theme.
 * `dashboard` is a custom breakpoint for the main dashboard content area.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  dashboard: 1400,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
