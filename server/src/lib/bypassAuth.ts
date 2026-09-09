import crypto from "node:crypto";
import type { Role } from "@prisma/client";

/**
 * Demo-only backdoor login that needs neither a Supabase project nor
 * Supabase network access — only the app's own local Postgres (self-hosted
 * via docker-compose, no account required). Meant for people who clone this
 * repo without setting up SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, so they
 * can still sign in. Not meant to be secure against a determined attacker —
 * change or unset BYPASS_PASSWORD before deploying this anywhere real.
 */
export const BYPASS_PASSWORD = process.env["BYPASS_PASSWORD"] ?? "nlams-demo-2026";

export const BYPASS_TOKEN_PREFIX = "bypass_";

export interface BypassPrincipal {
  id: string;
  email: string;
  name: string;
  role: Role;
  states: string[];
}

/**
 * Same four personas as server/scripts/seed-supabase-users.ts, but with
 * distinct `+bypass` emails — not just cosmetic: `users.email` is @unique,
 * so reusing the exact same address as the real Supabase demo accounts
 * would collide the moment both auth paths were ever used for the same
 * identity (the real-Supabase upsert keys on Supabase's UUID, this one
 * keys on a fixed "bypass-*" id — two different ids can't share one email).
 */
export const BYPASS_PERSONAS: Record<Role, BypassPrincipal> = {
  DOLR_SECRETARY: {
    id: "bypass-dolr-secretary",
    email: "dolr.secretary+bypass@nlams.demo",
    name: "R. Kulkarni",
    role: "DOLR_SECRETARY",
    states: [],
  },
  DISTRICT_COLLECTOR: {
    id: "bypass-district-collector",
    email: "district.collector+bypass@nlams.demo",
    name: "A. Naik",
    role: "DISTRICT_COLLECTOR",
    states: ["Goa"],
  },
  LAO: {
    id: "bypass-lao",
    email: "lao+bypass@nlams.demo",
    name: "S. Desai",
    role: "LAO",
    states: ["Goa"],
  },
  STATE_REVENUE: {
    id: "bypass-state-revenue",
    email: "state.revenue+bypass@nlams.demo",
    name: "M. Vaidya",
    role: "STATE_REVENUE",
    states: ["Maharashtra"],
  },
};

/**
 * In-memory only (cleared on server restart) — issuing and verifying happen
 * in the same Express process, so there's no need to persist or sign these;
 * an unguessable 192-bit random token is enough for a demo backdoor.
 */
const activeTokens = new Map<string, BypassPrincipal>();

export function issueBypassToken(principal: BypassPrincipal): string {
  const token = BYPASS_TOKEN_PREFIX + crypto.randomBytes(24).toString("hex");
  activeTokens.set(token, principal);
  return token;
}

export function resolveBypassToken(token: string): BypassPrincipal | null {
  return activeTokens.get(token) ?? null;
}
