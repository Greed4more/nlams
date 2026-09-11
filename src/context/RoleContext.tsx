import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Proposal } from "@/data/mockData";
import { useAuth, ROLE_LABEL, ROLE_CAN_ACT, type Role } from "@/context/AuthContext";
import { useProposalsQuery } from "@/hooks/useProposals";
import { api, ApiError } from "@/lib/api";
import { getBypassSession, DEMO_BYPASS_PASSWORD, type BypassSession } from "@/lib/bypassAuth";

export const NO_CREDENTIALS_HINT = "Requires LAO credentials";

export interface PersonaPreset {
  role: Role;
  label: string;
  name: string;
  states: string[];
  district?: string;
  description: string;
}

export const PERSONA_PRESETS: Record<Role, PersonaPreset> = {
  DOLR_SECRETARY: {
    role: "DOLR_SECRETARY",
    label: "DoLR Secretary",
    name: "Dr. Alok Kumar",
    states: [],
    description: "National apex overview, state comparisons & policy enforcement",
  },
  DISTRICT_COLLECTOR: {
    role: "DISTRICT_COLLECTOR",
    label: "District Collector",
    name: "Asvin Chandru, IAS",
    states: ["Goa"],
    district: "South Goa",
    description: "District governance, legal lapse tracking & R&R rehabilitation",
  },
  LAO: {
    role: "LAO",
    label: "Land Acquisition Officer",
    name: "Rohan Dessai, GCS",
    states: ["Goa"],
    district: "South Goa",
    description: "Casework execution, Section 26 awards & field title verification",
  },
  STATE_REVENUE: {
    role: "STATE_REVENUE",
    label: "State Revenue Dept",
    name: "Vikas Deshmukh",
    states: ["Maharashtra"],
    description: "Inter-district monitoring, requiring body outlays & land banks",
  },
};

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
  /**
   * Actually re-authenticates as the chosen demo persona (via the bypass
   * login endpoint), replacing the whole session — not just a client-side
   * display override. Only works from an existing Quick Demo Access
   * session; on a real Supabase login it's a no-op with a toast, since a
   * client can't silently escalate its own privileges.
   */
  switchPersona: (role: Role) => Promise<void>;
  switchingPersona: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { role, states: rawAuthStates, displayName, signInWithBypass } = useAuth();
  const [switchingPersona, setSwitchingPersona] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useProposalsQuery();
  const proposals = useMemo(() => data ?? [], [data]);

  const states = rawAuthStates.length > 0 ? rawAuthStates : null;

  const value = useMemo<RoleContextValue>(() => {
    const inScope = (p: Proposal) => !states || states.includes(p.state);
    const roleLabel = role ? ROLE_LABEL[role] : "No role assigned";
    const scopeLabel = states ? states.join(", ") : "All states (National)";
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
      switchingPersona,
      switchPersona: async (nextRole: Role) => {
        if (!getBypassSession()) {
          toast.error("Persona switching only works for Quick Demo Access sign-ins.", {
            description: 'Sign out and use "Quick Demo Access" on the sign-in page first.',
          });
          return;
        }
        setSwitchingPersona(true);
        try {
          const res = await api.post<BypassSession>("/api/public/auth/bypass", {
            password: DEMO_BYPASS_PASSWORD,
            role: nextRole,
          });
          signInWithBypass(res);
          // Every proposal/grievance/dashboard query is scoped server-side to
          // the caller's token — the new persona invalidates all of it.
          await qc.invalidateQueries();
        } catch (err) {
          toast.error("Could not switch persona", {
            description: err instanceof ApiError ? err.message : "Unknown error",
          });
        } finally {
          setSwitchingPersona(false);
        }
      },
    };
  }, [role, states, displayName, proposals, isLoading, switchingPersona, qc, signInWithBypass]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
