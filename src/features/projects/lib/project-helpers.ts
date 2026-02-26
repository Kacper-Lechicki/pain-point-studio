import type { ResearchPhase } from '@/features/projects/types';

/** Checks whether a project (or bare status value) represents the archived state. */
export function isProjectArchived(projectOrStatus: { status: string } | string): boolean {
  const status = typeof projectOrStatus === 'string' ? projectOrStatus : projectOrStatus.status;

  return status === 'archived';
}

const PHASE_PRIORITY: ResearchPhase[] = ['decision', 'validation', 'research', 'idea'];

/** Derives the most advanced research phase across all surveys in a project. */
export function deriveProjectPhase(
  surveys: { researchPhase: string | null }[]
): ResearchPhase | null {
  for (const phase of PHASE_PRIORITY) {
    if (surveys.some((s) => s.researchPhase === phase)) {
      return phase;
    }
  }

  return null;
}
