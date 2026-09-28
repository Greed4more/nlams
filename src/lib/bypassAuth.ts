/**
 * Client-side half of the demo sign-in bypass (see
 * server/src/lib/bypassAuth.ts). Stores the bypass token in localStorage in
 * a shape AuthContext can fold into a normal-looking Supabase Session, so
 * every other consumer of useAuth()/api.ts keeps working unmodified.
 *
 * The bypass password itself never reaches the browser: the sign-in screen
 * exchanges it for a role-scoped token via POST /api/public/auth/bypass.
 * Switching roles requires signing in again.
 */
const STORAGE_KEY = "nlams-bypass-session";

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
