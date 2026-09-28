import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useRole } from "@/context/RoleContext";
import { navForRole } from "./NavItems";

/** Horizontal gov-portal-style main menu bar (desktop, ≥768px). */
export function TopNav() {
  const { t } = useI18n();
  const { role } = useRole();
  const items = navForRole(role);

  return (
    <nav aria-label="Main" className="hidden bg-ink md:block">
      <ul className="mx-auto flex max-w-[1600px] items-stretch px-2 sm:px-4">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          return (
            <li key={to}>
              <Link
                to={to}
                title={label}
                activeOptions={{ exact: to === "/dashboard" }}
                className="flex items-center gap-2 border-b-2 border-transparent px-3.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-foreground/75 transition-colors hover:bg-ink-hover hover:text-ink-foreground lg:px-4"
                activeProps={{
                  className: "border-saffron bg-ink-hover text-ink-foreground",
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
  const items = navForRole(role);

  return (
    <div className="flex h-full flex-col bg-ink text-ink-foreground">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="font-serif text-[16px] font-bold tracking-[0.12em]">
          BHUMITRA <span className="text-[12px] font-semibold text-ink-muted">भूमित्र</span>
        </div>
        <div className="mt-1 text-[10.5px] leading-tight text-ink-muted">
          Ministry of Rural Development
          <br />
          Department of Land Resources &middot; भारत सरकार
        </div>
      </div>
      <nav className="flex-1 px-2 py-3">
        <div className="label-xs px-2 pb-2 text-ink-muted">Navigation</div>
        <ul className="space-y-0.5">
          {items.map(({ to, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
              <li key={to}>
                <Link
                  to={to}
                  title={label}
                  onClick={onNavigate}
                  activeOptions={{ exact: to === "/dashboard" }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-[13px] font-medium text-ink-foreground/80 transition-colors hover:bg-ink-hover hover:text-ink-foreground",
                  )}
                  activeProps={{
                    className: "border-l-2 border-saffron bg-ink-hover pl-2 text-ink-foreground",
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
      <div className="border-t border-white/10 px-4 py-3 text-[10px] leading-relaxed text-ink-muted">
        RFCTLARR Act, 2013
        <br />
        Build 4.2.1 · Restricted
      </div>
    </div>
  );
}
