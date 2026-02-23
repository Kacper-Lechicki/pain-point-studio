/** Checks whether a project (or bare status value) represents the archived state. */
export function isProjectArchived(projectOrStatus: { status: string } | string): boolean {
  const status = typeof projectOrStatus === 'string' ? projectOrStatus : projectOrStatus.status;

  return status === 'archived';
}
