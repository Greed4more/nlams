/**
 * Auth against the real NLAMS server (server/src/routes/public.ts) — the
 * same demo bypass endpoint the main NLAMS web app's "Quick Demo Access"
 * panel uses. `syncEngine.ts` reads this same 'bhumitra_session' key for
 * its Authorization headers, so this is the one place session shape and
 * storage key are defined.
 */
const SESSION_KEY = 'bhumitra_session';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export interface BhumitraSession {
  token: string;
  role: string;
  name: string;
  email: string;
  states: string[];
}

export function getSession(): BhumitraSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BhumitraSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * This app is LAO-only (field casework officers), so the role is fixed
 * rather than offered as a picker like the main web app's sign-in page.
 */
export async function loginWithBypass(password: string): Promise<BhumitraSession> {
  const res = await fetch(`${API_BASE}/api/public/auth/bypass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, role: 'LAO' })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Sign-in failed' }));
    throw new Error((body as { error?: string }).error ?? 'Sign-in failed');
  }

  const session = (await res.json()) as BhumitraSession;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
