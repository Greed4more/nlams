import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  getBypassSession,
  setBypassSession,
  clearBypassSession,
  type BypassSession,
} from "@/lib/bypassAuth";

/** Wraps a demo bypass session in the same shape useAuth()'s consumers
 * already expect from a real Supabase Session — see lib/bypassAuth.ts. */
function bypassToSession(b: BypassSession): Session {
  const user = {
    id: b.token,
    aud: "authenticated",
    role: "authenticated",
    email: b.email,
    app_metadata: { role: b.role, states: b.states },
    user_metadata: { name: b.name },
    identities: [],
    created_at: new Date().toISOString(),
  } as unknown as User;

  return {
    access_token: b.token,
    token_type: "bearer",
    expires_in: 60 * 60 * 24,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    refresh_token: "bypass",
    user,
  } as unknown as Session;
}

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
  /** null when the account has no BHUMITRA role assigned yet (app_metadata.role unset). */
  role: Role | null;
  /** Empty = national scope. */
  states: string[];
  displayName: string;
  signOut: () => Promise<void>;
  /** Demo bypass login (no Supabase account needed) — see lib/bypassAuth.ts. */
  signInWithBypass: (session: BypassSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bypass = getBypassSession();
    if (bypass) {
      setSession(bypassToSession(bypass));
      setLoading(false);
      return;
    }
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
        if (getBypassSession()) {
          clearBypassSession();
          setSession(null);
          return;
        }
        await supabase.auth.signOut();
      },
      signInWithBypass: (bypass: BypassSession) => {
        setBypassSession(bypass);
        setSession(bypassToSession(bypass));
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
