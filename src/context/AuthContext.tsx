import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Role = "DOLR_SECRETARY" | "DISTRICT_COLLECTOR" | "LAO" | "STATE_REVENUE";

export const ROLE_LABEL: Record<Role, string> = {
  DOLR_SECRETARY: "DoLR Secretary",
  DISTRICT_COLLECTOR: "District Collector",
  LAO: "Land Acquisition Officer",
  STATE_REVENUE: "State Revenue Dept",
};

/** Only the Land Acquisition Officer persona may execute statutory actions. */
export const ROLE_CAN_ACT: Record<Role, boolean> = {
  DOLR_SECRETARY: false,
  DISTRICT_COLLECTOR: false,
  LAO: true,
  STATE_REVENUE: false,
};

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  /** null when the account has no NLAMS role assigned yet (app_metadata.role unset). */
  role: Role | null;
  /** Empty = national scope. */
  states: string[];
  displayName: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((error: unknown) => console.error("Failed to resolve Supabase session", error))
      .finally(() => setLoading(false));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const role = (user?.app_metadata["role"] as Role | undefined) ?? null;
    const states: string[] = Array.isArray(user?.app_metadata["states"])
      ? (user.app_metadata["states"] as string[])
      : [];
    const displayName =
      (user?.user_metadata["name"] as string | undefined) ?? user?.email ?? "Unknown";

    return {
      loading,
      session,
      user,
      role,
      states,
      displayName,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
