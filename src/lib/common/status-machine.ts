// ── Shared status-machine types & utilities ─────────────────────────
//
// Both projects and surveys use an identical state-machine pattern.
// This module provides the generic infrastructure so each feature
// only defines its own status configs and transition maps.

/** Visual config for a status badge. */
export interface StatusBadgeConfig {
  variant: 'default' | 'secondary' | 'outline';
  className: string;
  /** Optional pulsing dot indicator (e.g. for "collecting" states). */
  showPulseDot?: boolean;
}

/** A single transition rule in a status state machine. */
export interface StatusTransition<S extends string> {
  method: 'update' | 'delete';
  toStatus?: S | null;
  fromStatuses: readonly S[];
}

/** A map of action names to their transition rules. */
export type StatusTransitionMap<S extends string> = Record<string, StatusTransition<S>>;

/** KPI text color for the "all" total (not tied to a specific status). */
export const KPI_COLOR_ALL = 'text-foreground';

/** Checks if a given action is valid from the current status. */
export function canTransition<S extends string>(
  from: S,
  action: string,
  transitions: StatusTransitionMap<S>
): boolean {
  const transition = transitions[action];

  if (!transition) {
    return false;
  }

  return (transition.fromStatuses as readonly string[]).includes(from);
}

/** Returns all valid action keys for an entity with the given status. */
export function getAvailableActions<S extends string, A extends string = string>(
  status: S,
  transitions: StatusTransitionMap<S>
): A[] {
  return (Object.keys(transitions) as A[]).filter((action) =>
    canTransition(status, action, transitions)
  );
}
