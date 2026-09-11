/**
 * Client-side half of the demo sign-in bypass (see
 * server/src/lib/bypassAuth.ts). Stores the bypass token in localStorage in
 * a shape AuthContext can fold into a normal-looking Supabase Session, so
 * every other consumer of useAuth()/api.ts keeps working unmodified.
 */
const STORAGE_KEY = "nlams-bypass-session";

/**
 * Matches server/src/lib/bypassAuth.ts's BYPASS_PASSWORD default. Public/
 * demo-only by design (see that file's doc comment) — already shown in the
 * clear on the sign-in page. Used so the TopBar persona switcher can
 * instantly re-authenticate as another demo persona without re-prompting
 * for a password every time, but only ever from an existing bypass session
 * (see RoleContext.switchPersona) — a real Supabase session is never
 * silently swapped.
 */
export const DEMO_BYPASS_PASSWORD = "nlams-demo-2026";

export interface BypassSession {
  token: string;
  role: string;
  name: string;
  email: string;
  states: string[];
}

export function getBypassSession(): BypassSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BypassSession) : null;
  } catch {
    return null;
  }
}

export function setBypassSession(session: BypassSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearBypassSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
