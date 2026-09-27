/**
 * Records the previous successful sign-in on this device so the dashboard can
 * show the security-conscious "Last login" line used by government/banking
 * systems. Only the timestamp is captured — no IP or location is inferred.
 */
const KEY = "bhumitra.lastLogin";

export interface LastLogin {
  /** ISO timestamp of the previous successful sign-in. */
  at: string;
}

export function recordLogin(at: Date = new Date()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: at.toISOString() } satisfies LastLogin));
  } catch {
    // storage unavailable — the notice simply won't render
  }
}

export function getLastLogin(): LastLogin | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastLogin;
    return parsed.at ? parsed : null;
  } catch {
    return null;
  }
}

/** e.g. "27-09-2026, 10:14 IST" */
export function formatLastLogin(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
  return `${date}, ${time} IST`;
}
