import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { STATES, type Proposal } from "@/data/mockData";
import { useAuth, ROLE_LABEL, ROLE_CAN_ACT, type Role } from "@/context/AuthContext";
import { useProposalsQuery } from "@/hooks/useProposals";

/** Tooltip shown when a role lacks the credential for a statutory action. */
export const NO_CREDENTIALS_HINT = "Requires LAO credentials";

/**
 * Two-letter monogram per role for the masthead avatar. Deliberately derived
 * from the role, not a person — the platform identifies officers by role only.
 */
export const ROLE_INITIALS: Record<Role, string> = {
  DOLR_SECRETARY: "DS",
  DISTRICT_COLLECTOR: "DC",
  LAO: "LA",
  STATE_REVENUE: "SR",
  FINANCE_OFFICER: "FO",
};

interface RoleContextValue {
  role: Role | null;
  roleLabel: string;
  /** Role monogram for avatars — never a personal name. */
  roleInitials: string;
  /** null = national scope (all states) */
  states: string[] | null;
  /** Officer-selected region view within the authorised scope; null = whole scope. */
  activeState: string | null;
  setActiveState: (state: string | null) => void;
  /** States selectable in the header for the signed-in role. */
  stateOptions: string[];
  dashboardTitle: string;
  scopeLabel: string;
  canAct: boolean;
  proposals: Proposal[];
  proposalsLoading: boolean;
  scopedProposals: Proposal[];
  inScope: (p: Proposal) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { role, states: rawAuthStates } = useAuth();
  const [requestedState, setRequestedState] = useState<string | null>(null);

  const { data, isLoading } = useProposalsQuery();
  const proposals = useMemo(() => data ?? [], [data]);

  const states = rawAuthStates.length > 0 ? rawAuthStates : null;

  // Region view selected in the header. Ignored (reset to whole scope) if the
  // signed-in role isn't authorised for that state.
  const activeState =
    requestedState && (!states || states.includes(requestedState)) ? requestedState : null;
  const stateOptions = useMemo(() => states ?? STATES, [states]);

  const value = useMemo<RoleContextValue>(() => {
    const inScope = (p: Proposal) =>
      (!states || states.includes(p.state)) && (!activeState || p.state === activeState);
    const roleLabel = role ? ROLE_LABEL[role] : "No role assigned";
    const scopeLabel = activeState ?? (states ? states.join(", ") : "All states (National)");
    const dashboardTitle = states ? `${roleLabel} Workspace — ${scopeLabel}` : "National Overview";

    return {
      role,
      roleLabel,
      roleInitials: role ? ROLE_INITIALS[role] : "—",
      states,
      activeState,
      setActiveState: (next: string | null) => setRequestedState(next),
      stateOptions,
      dashboardTitle,
      scopeLabel,
      canAct: role ? ROLE_CAN_ACT[role] : false,
      proposals,
      proposalsLoading: isLoading,
      scopedProposals: proposals.filter(inScope),
      inScope,
    };
  }, [role, states, activeState, stateOptions, proposals, isLoading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
