export interface ScopedUser {
  states: string[];
}

/**
 * Prisma `where` fragment restricting queries to the user's state scope.
 * Empty `states` = national scope (DoLR Secretary) — no restriction.
 */
export function proposalScopeWhere(user: ScopedUser): { state?: { in: string[] } } {
  return user.states.length > 0 ? { state: { in: user.states } } : {};
}

export function isStateInScope(user: ScopedUser, state: string): boolean {
  return user.states.length === 0 || user.states.includes(state);
}
