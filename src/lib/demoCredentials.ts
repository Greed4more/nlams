import type { Role } from "@/context/AuthContext";

/**
 * Evaluation credentials surfaced on the officer sign-in screen. One master
 * password maps each role to its canonical demo account; the sign-in form
 * exchanges the pair for a bypass session so judges do not need seeded
 * Supabase accounts.
 */
export const DEMO_MASTER_PASSWORD = "admin123";

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "DOLR_SECRETARY",
    label: "DoLR Secretary — national scope",
    email: "dolr.secretary@nlams.demo",
  },
  {
    role: "DISTRICT_COLLECTOR",
    label: "District Collector — South Goa",
    email: "district.collector@nlams.demo",
  },
  { role: "LAO", label: "Land Acquisition Officer — South Goa", email: "lao@nlams.demo" },
  {
    role: "STATE_REVENUE",
    label: "State Revenue Dept — Maharashtra",
    email: "state.revenue@nlams.demo",
  },
  {
    role: "FINANCE_OFFICER",
    label: "Finance Officer — Compensation & Disbursement",
    email: "finance.officer@nlams.demo",
  },
];

export function demoAccountForEmail(email: string): DemoAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((account) => account.email === normalized);
}
