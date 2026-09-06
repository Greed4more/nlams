import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Proposal } from "@/data/mockData";
import { useAuth, ROLE_LABEL, ROLE_CAN_ACT, type Role } from "@/context/AuthContext";
import { useProposalsQuery } from "@/hooks/useProposals";

export const NO_CREDENTIALS_HINT = "Requires LAO credentials";

interface RoleContextValue {
  role: Role | null;
  roleLabel: string;
  /** null = national scope (all states) */
  states: string[] | null;
  dashboardTitle: string;
  scopeLabel: string;
  canAct: boolean;
  initials: string;
  person: string;
  proposals: Proposal[];
  proposalsLoading: boolean;
  scopedProposals: Proposal[];
  inScope: (p: Proposal) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { role, states: rawStates, displayName } = useAuth();
  const { data, isLoading } = useProposalsQuery();
  const proposals = useMemo(() => data ?? [], [data]);

  const value = useMemo<RoleContextValue>(() => {
    const states = rawStates.length > 0 ? rawStates : null;
    const inScope = (p: Proposal) => !states || states.includes(p.state);
    const roleLabel = role ? ROLE_LABEL[role] : "No role assigned";
    const scopeLabel = states ? states.join(", ") : "All states";
    const dashboardTitle = states ? `${roleLabel} Workspace — ${scopeLabel}` : "National Overview";

    return {
      role,
      roleLabel,
      states,
      dashboardTitle,
      scopeLabel,
      canAct: role ? ROLE_CAN_ACT[role] : false,
      initials: initialsOf(displayName),
      person: displayName,
      proposals,
      proposalsLoading: isLoading,
      scopedProposals: proposals.filter(inScope),
      inScope,
    };
  }, [role, rawStates, displayName, proposals, isLoading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
