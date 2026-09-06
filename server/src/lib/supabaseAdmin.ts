import { createClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!url || !serviceRoleKey) {
  console.warn(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — auth will reject every request until they're added to server/.env.",
  );
}

/** Service-role client — server-only, never expose this key to the browser. */
export const supabaseAdmin = createClient(
  url ?? "https://placeholder.supabase.co",
  serviceRoleKey ?? "placeholder",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
