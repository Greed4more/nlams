import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabaseAdmin.js";

/**
 * Creates the four NLAMS demo personas as real Supabase Auth users, with the
 * role (and state scope) the app reads from app_metadata. Run once after
 * you've added SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to server/.env:
 *
 *   bun run seed:supabase-users   (from server/)
 *
 * Safe to re-run — existing accounts (matched by email) get their
 * app_metadata updated in place rather than being duplicated.
 */
const DEMO_PASSWORD = "NlamsDemo!2026";

const PERSONAS = [
  {
    email: "dolr.secretary@nlams.demo",
    name: "R. Kulkarni",
    role: "DOLR_SECRETARY",
    states: [] as string[],
  },
  {
    email: "district.collector@nlams.demo",
    name: "A. Naik",
    role: "DISTRICT_COLLECTOR",
    states: ["Goa"],
  },
  {
    email: "lao@nlams.demo",
    name: "S. Desai",
    role: "LAO",
    states: ["Goa"],
  },
  {
    email: "state.revenue@nlams.demo",
    name: "M. Vaidya",
    role: "STATE_REVENUE",
    states: ["Maharashtra"],
  },
] as const;

async function findByEmail(email: string) {
  // Supabase's admin API doesn't filter listUsers by email server-side, so we
  // page through — fine for a handful of demo accounts.
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  for (const persona of PERSONAS) {
    const app_metadata = { role: persona.role, states: persona.states };
    const existing = await findByEmail(persona.email);

    if (existing) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        app_metadata,
        user_metadata: { name: persona.name },
      });
      if (error) throw error;
      console.log(`Updated ${persona.email} → ${persona.role}`);
      continue;
    }

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: persona.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      app_metadata,
      user_metadata: { name: persona.name },
    });
    if (error) throw error;
    console.log(`Created ${persona.email} → ${persona.role}`);
  }

  console.log(`\nAll demo accounts share the password: ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
