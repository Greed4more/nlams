import { LayoutDashboard, FileStack, Calculator, Map, ShieldAlert, Settings2 } from "lucide-react";

export const NAV = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/proposals", labelKey: "nav.proposals", icon: FileStack },
  { to: "/calculator", labelKey: "nav.calculator", icon: Calculator },
  { to: "/map-view", labelKey: "nav.map", icon: Map },
  { to: "/grievances", labelKey: "nav.grievances", icon: ShieldAlert },
] as const;

export const ADMIN_NAV = { to: "/admin/adapters", labelKey: "nav.admin", icon: Settings2 } as const;
