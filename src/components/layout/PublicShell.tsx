import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Landmark } from "lucide-react";

/**
 * Layout for the public case-transparency portal (Module 7) — deliberately
 * separate from AppShell: no Supabase session required, no sidebar, no
 * officer chrome. Talks only to the unauthenticated /api/public/* endpoints.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="bg-navy px-5 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link to="/public" className="flex items-center gap-2.5">
            <Landmark className="size-5 shrink-0" strokeWidth={1.75} />
            <div>
              <div className="text-[14px] font-bold leading-tight tracking-[0.1em]">
                BHUMITRA PUBLIC PORTAL
              </div>
              <div className="text-[10.5px] leading-tight text-navy-muted">
                Department of Land Resources · Ministry of Rural Development
              </div>
            </div>
          </Link>
          <Link
            to="/sign-in"
            className="shrink-0 rounded-[4px] border border-white/20 px-3 py-1.5 text-[11.5px] font-medium text-navy-foreground/90 transition-colors hover:bg-navy-hover"
          >
            Officer Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6">{children}</main>

      <footer className="border-t border-border px-5 py-4 text-center text-[10.5px] leading-relaxed text-muted-foreground">
        Public disclosure under Section 4 &amp; Section 11, RFCTLARR Act, 2013. Personal
        identifiable information excluded per the Digital Personal Data Protection Act, 2023.
      </footer>
    </div>
  );
}
