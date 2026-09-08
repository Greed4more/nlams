import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FileStack, Calculator, Map, ShieldAlert, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useRole } from "@/context/RoleContext";

export const NAV = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/proposals", labelKey: "nav.proposals", icon: FileStack },
  { to: "/calculator", labelKey: "nav.calculator", icon: Calculator },
  { to: "/map-view", labelKey: "nav.map", icon: Map },
  { to: "/grievances", labelKey: "nav.grievances", icon: ShieldAlert },
] as const;

const ADMIN_NAV = { to: "/admin/adapters", labelKey: "nav.admin", icon: Settings2 } as const;

/** `compact` renders the icon rail (used between 768px and 1280px). */
export function SidebarContent({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const { role } = useRole();
  const items = role === "DOLR_SECRETARY" ? [...NAV, ADMIN_NAV] : NAV;
  return (
    <div className="flex h-full flex-col bg-navy text-navy-foreground">
      <div className={cn("border-b border-white/10 py-4", compact ? "px-2 text-center" : "px-4")}>
        <div className={cn("font-bold tracking-[0.18em]", compact ? "text-[13px]" : "text-[17px]")}>
          NLAMS
        </div>
        {!compact && (
          <div className="mt-1 text-[11px] leading-tight text-navy-muted">
            Ministry of Rural Development
            <br />
            Department of Land Resources
          </div>
        )}
      </div>

      <nav className={cn("flex-1 py-3", compact ? "px-1.5" : "px-2")}>
        {!compact && <div className="label-xs px-2 pb-2 text-navy-muted">Navigation</div>}
        <ul className="space-y-0.5">
          {items.map(({ to, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
              <li key={to}>
                <Link
                  to={to}
                  title={label}
                  onClick={onNavigate}
                  activeOptions={{ exact: to === "/" }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[4px] py-2 text-[13px] font-medium text-navy-foreground/80 transition-colors hover:bg-navy-hover hover:text-navy-foreground",
                    compact ? "justify-center px-2" : "px-2.5",
                  )}
                  activeProps={{
                    className: cn(
                      "bg-navy-hover text-navy-foreground",
                      !compact && "border-l-2 border-status-info pl-2",
                    ),
                  }}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {!compact && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!compact && (
        <div className="border-t border-white/10 px-4 py-3 text-[10px] leading-relaxed text-navy-muted">
          RFCTLARR Act, 2013
          <br />
          Build 4.2.1 · Restricted
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Icon rail: 768px – 1280px */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col md:flex xl:hidden">
        <SidebarContent compact />
      </aside>
      {/* Full sidebar: 1280px and up */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col xl:flex">
        <SidebarContent />
      </aside>
    </>
  );
}
