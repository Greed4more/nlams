import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { proposals as ALL_PROPOSALS, type Proposal } from "@/data/mockData";

export type Role =
  | "District Collector – South Goa"
  | "Land Acquisition Officer"
  | "DoLR Secretary"
  | "State Revenue Dept";

export const ROLES: Role[] = [
  "District Collector – South Goa",
  "Land Acquisition Officer",
  "DoLR Secretary",
  "State Revenue Dept",
];

export interface RoleConfig {
  /** null = national scope (all states) */
  states: string[] | null;
  dashboardTitle: string;
  scopeLabel: string;
  /** May execute statutory actions (advance stage, officer override) */
  canAct: boolean;
  initials: string;
  person: string;
  designation: string;
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  "DoLR Secretary": {
    states: null,
    dashboardTitle: "National Overview",
    scopeLabel: "All states",
    canAct: false,
    initials: "RK",
    person: "R. Kulkarni",
    designation: "IAS · DoLR",
  },
  "District Collector – South Goa": {
    states: ["Goa"],
    dashboardTitle: "District Overview – South Goa",
    scopeLabel: "Goa",
    canAct: false,
    initials: "AN",
    person: "A. Naik",
    designation: "IAS · South Goa",
  },
  "Land Acquisition Officer": {
    states: ["Goa"],
    dashboardTitle: "Acquisition Officer Workspace – South Goa",
    scopeLabel: "Goa",
    canAct: true,
    initials: "SD",
    person: "S. Desai",
    designation: "LAO · South Goa",
  },
  "State Revenue Dept": {
    states: ["Maharashtra"],
    dashboardTitle: "State Overview – Maharashtra",
    scopeLabel: "Maharashtra",
    canAct: false,
    initials: "MV",
    person: "M. Vaidya",
    designation: "Revenue Dept · MH",
  },
};

export const NO_CREDENTIALS_HINT = "Requires LAO credentials";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  config: RoleConfig;
  canAct: boolean;
  scopedProposals: Proposal[];
  inScope: (p: Proposal) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("DoLR Secretary");

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    toast(`Viewing as ${next}`, {
      description: ROLE_CONFIG[next].states
        ? `Data scoped to ${ROLE_CONFIG[next].scopeLabel}.`
        : "National scope — all states visible.",
    });
  }, []);

  const value = useMemo<RoleContextValue>(() => {
    const config = ROLE_CONFIG[role];
    const inScope = (p: Proposal) => !config.states || config.states.includes(p.state);
    return {
      role,
      setRole,
      config,
      canAct: config.canAct,
      scopedProposals: ALL_PROPOSALS.filter(inScope),
      inScope,
    };
  }, [role, setRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
