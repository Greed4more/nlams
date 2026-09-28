import {
  LayoutDashboard,
  FileStack,
  Calculator,
  Map,
  ShieldAlert,
  Settings2,
  BadgeIndianRupee,
} from "lucide-react";
import type { Role } from "@/context/AuthContext";

export const NAV = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/proposals", labelKey: "nav.proposals", icon: FileStack },
  { to: "/calculator", labelKey: "nav.calculator", icon: Calculator },
  { to: "/map-view", labelKey: "nav.map", icon: Map },
  { to: "/grievances", labelKey: "nav.grievances", icon: ShieldAlert },
] as const;

export const ADMIN_NAV = { to: "/admin/adapters", labelKey: "nav.admin", icon: Settings2 } as const;

/** Finance Officer workspace — Approved Projects & Disbursement. */
export const FINANCE_NAV = {
  to: "/approved-projects",
  labelKey: "nav.approvedProjects",
  icon: BadgeIndianRupee,
} as const;

/** Role-aware main menu: the Finance Officer gets the dedicated finance module
 * alongside the common registers; the DoLR Secretary additionally sees admin. */
export function navForRole(role: Role | null) {
  const base = role === "FINANCE_OFFICER" ? [NAV[0], FINANCE_NAV, ...NAV.slice(1)] : [...NAV];
  return role === "DOLR_SECRETARY" ? [...base, ADMIN_NAV] : base;
}
