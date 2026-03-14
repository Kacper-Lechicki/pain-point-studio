/** All research phases as a const tuple (source of truth, matching DB CHECK constraints). */
export const RESEARCH_PHASES = ['idea', 'research', 'validation', 'decision'] as const;

export type ResearchPhase = (typeof RESEARCH_PHASES)[number];
