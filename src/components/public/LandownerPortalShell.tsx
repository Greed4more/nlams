import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  HeartHandshake,
  Activity,
  Menu,
  Landmark,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { GovFooter } from "@/components/layout/GovFooter";
import { cn } from "@/lib/utils";

const PORTAL_NAV = [
  { to: "/public/landowners", label: "Landowners", icon: Users },
  { to: "/public/rr", label: "R&R", icon: HeartHandshake },
  { to: "/public", label: "Project Status", icon: Activity },
] as const;

/**
 * Shell for the public landowner portal (land information, compensation and
 * R&R tracking) — no sign-in, sidebar + portal utility bar mirroring the
 * reference LAMS portal chrome.
 */
export function LandownerPortalShell({
  breadcrumb,
  children,
}: {
  breadcrumb: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 bg-ink px-3 text-ink-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 place-items-center rounded-[4px] bg-white/10">
            <Menu className="size-4" />
          </span>
          <Link to="/public/landowners" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-[4px] bg-white/10">
              <Landmark className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-[13px] font-bold leading-tight tracking-[0.08em]">
                LAMS PORTAL
              </span>
              <span className="block truncate text-[9.5px] leading-tight text-white/60">
                Govt. of India · SIH 2026
              </span>
            </span>
          </Link>
          <nav className="hidden min-w-0 items-center gap-1 text-[11.5px] text-white/70 md:flex">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/30">›</span>}
                <span className={cn("truncate", i === breadcrumb.length - 1 && "text-white")}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-[4px] border border-white/15 px-2 py-1 text-[10.5px] text-white/80 lg:flex">
            <ShieldCheck className="size-3.5" /> State: All India
          </span>
          <span className="hidden items-center gap-1.5 rounded-[4px] border border-white/15 px-2 py-1 text-[10.5px] text-white/80 lg:flex">
            <Languages className="size-3.5" /> Translate
          </span>
          <span className="hidden items-center gap-1.5 rounded-[4px] border border-white/15 px-2 py-1 text-[10.5px] text-white/80 xl:flex">
            <Landmark className="size-3.5" /> NIC-Bhoomi Gateway
          </span>
          <Link
            to="/sign-in"
            className="flex items-center gap-2 rounded-[4px] bg-white/10 px-2 py-1 transition-colors hover:bg-white/20"
          >
            <span className="grid size-6 place-items-center rounded-full bg-status-info text-[9px] font-bold text-white">
              SU
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[10.5px] font-semibold leading-tight">System User</span>
              <span className="block text-[9px] leading-tight text-white/60">Generic User</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[190px] shrink-0 flex-col justify-between border-r border-border bg-ink lg:flex">
          <nav className="p-2">
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/public" }}
                  activeProps={{
                    className: "bg-white/10 text-white border-l-2 border-status-info",
                  }}
                  inactiveProps={{ className: "text-white/70 hover:bg-white/5 hover:text-white" }}
                  className="mt-0.5 flex items-center gap-2.5 rounded-[3px] px-3 py-2 text-[12px] font-medium transition-colors"
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 border-t border-white/10 p-3 text-ink-foreground">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-status-info text-[10px] font-bold text-white">
              MA
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold">System User</span>
              <span className="block truncate text-[9.5px] text-white/60">Generic User</span>
            </span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-1.5 lg:hidden">
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/public" }}
                  activeProps={{ className: "bg-ink text-ink-foreground" }}
                  inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
                  className="flex shrink-0 items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main id="main-content" className="min-w-0 flex-1 px-4 py-5 sm:px-6">
            {children}
          </main>

          <GovFooter />
        </div>
      </div>
    </div>
  );
}
