import type { ResearchPhase } from '@/features/projects/types';

/** Checks whether a project (or bare status value) represents the archived state. */
export function isProjectArchived(projectOrStatus: { status: string } | string): boolean {
  const status = typeof projectOrStatus === 'string' ? projectOrStatus : projectOrStatus.status;

  return status === 'archived';
}

/** Checks whether a project (or bare status value) represents the completed state. */
export function isProjectCompleted(projectOrStatus: { status: string } | string): boolean {
  const status = typeof projectOrStatus === 'string' ? projectOrStatus : projectOrStatus.status;

  return status === 'completed';
}

/** Checks whether a project (or bare status value) is in the trash. */
export function isProjectTrashed(projectOrStatus: { status: string } | string): boolean {
  const status = typeof projectOrStatus === 'string' ? projectOrStatus : projectOrStatus.status;

  return status === 'trashed';
}

/** Returns true if the project is in a read-only state (archived or completed). */
export function isProjectReadOnly(projectOrStatus: { status: string } | string): boolean {
  return isProjectArchived(projectOrStatus) || isProjectCompleted(projectOrStatus);
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
