import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useRole } from "@/context/RoleContext";
import { NAV, ADMIN_NAV } from "./NavItems";

/** Horizontal gov-portal-style main menu bar (desktop, ≥768px). */
export function TopNav() {
  const { t } = useI18n();
  const { role } = useRole();
  const items = role === "DOLR_SECRETARY" ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <nav aria-label="Main" className="hidden bg-navy md:block">
      <ul className="mx-auto flex max-w-[1600px] items-stretch px-2 sm:px-4">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          return (
            <li key={to}>
              <Link
                to={to}
                title={label}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-2 border-b-2 border-transparent px-3.5 py-2.5 text-[12.5px] font-medium text-navy-foreground/80 transition-colors hover:bg-navy-hover hover:text-navy-foreground lg:px-4"
                activeProps={{
                  className: "border-status-info bg-navy-hover text-navy-foreground",
                }}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Vertical nav list for the mobile drawer (<768px). */
export function MobileNavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { role } = useRole();
  const items = role === "DOLR_SECRETARY" ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <div className="flex h-full flex-col bg-navy text-navy-foreground">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="text-[15px] font-bold tracking-[0.14em]">BHUMITRA</div>
        <div className="mt-1 text-[11px] leading-tight text-navy-muted">
          Ministry of Rural Development
          <br />
          Department of Land Resources
        </div>
      </div>
      <nav className="flex-1 px-2 py-3">
        <div className="label-xs px-2 pb-2 text-navy-muted">Navigation</div>
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
                    "flex items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-[13px] font-medium text-navy-foreground/80 transition-colors hover:bg-navy-hover hover:text-navy-foreground",
                  )}
                  activeProps={{
                    className:
                      "border-l-2 border-status-info bg-navy-hover pl-2 text-navy-foreground",
                  }}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/10 px-4 py-3 text-[10px] leading-relaxed text-navy-muted">
        RFCTLARR Act, 2013
        <br />
        Build 4.2.1 · Restricted
      </div>
    </div>
  );
}
