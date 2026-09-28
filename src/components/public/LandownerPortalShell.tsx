import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  HeartHandshake,
  MessageSquareWarning,
  Activity,
  Landmark,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { GovFooter } from "@/components/layout/GovFooter";
import { GigwUtilityBar } from "@/components/layout/GigwUtilityBar";

const PORTAL_NAV = [
  { to: "/public/landowners", label: "Landowners", icon: Users },
  { to: "/public/rr", label: "R&R", icon: HeartHandshake },
  { to: "/public/objections", label: "Objections", icon: MessageSquareWarning },
  { to: "/public", label: "Project Status", icon: Activity },
] as const;

/**
 * Shell for the public landowner portal (land information, R&R tracking and
 * objection filing) — no sign-in. Mirrors the officer dashboard layout: utility
 * strip, masthead and a horizontal top menu bar instead of a side rail.
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
      <GigwUtilityBar />

      <header className="bg-ink px-3 text-ink-foreground sm:px-5">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
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
            <nav className="hidden min-w-0 items-center gap-1 text-[11.5px] text-white/70 lg:flex">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb} className="flex items-center gap-1">
                  {i > 0 && <span className="text-white/30">›</span>}
                  <span className={i === breadcrumb.length - 1 ? "text-white" : undefined}>
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
        </div>

        {/* Top menu bar — same pattern as the officer dashboard's main nav. */}
        <nav aria-label="Public portal" className="mx-auto max-w-[1600px]">
          <ul className="flex items-stretch gap-0 overflow-x-auto">
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/public" }}
                    className="flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-foreground/70 transition-colors hover:bg-ink-hover hover:text-ink-foreground lg:px-4"
                    activeProps={{
                      className: "border-saffron bg-ink-hover text-ink-foreground",
                    }}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6">
        {children}
      </main>

      <GovFooter />
    </div>
  );
}
