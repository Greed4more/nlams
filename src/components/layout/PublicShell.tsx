import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GigwUtilityBar } from "./GigwUtilityBar";
import { GovFooter } from "./GovFooter";
import { AshokaChakra } from "./GovIdentity";

/**
 * Layout for the public case-transparency portal (Module 7) — deliberately
 * separate from AppShell: no Supabase session required, no sidebar, no
 * officer chrome. Talks only to the unauthenticated /api/public/* endpoints.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <GigwUtilityBar />
      <header className="bg-ink px-5 py-4 text-ink-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link to="/public" className="flex items-center gap-2.5">
            <AshokaChakra className="size-6 shrink-0" />
            <div>
              <div className="font-serif text-[14px] font-bold leading-tight tracking-[0.1em]">
                BHUMITRA &middot; भूमित्र
              </div>
              <div className="text-[10.5px] leading-tight text-ink-muted">
                Public Land Information Portal &middot; Department of Land Resources
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/public/landowners"
              className="hidden rounded-[4px] px-2.5 py-1.5 text-[11.5px] font-medium text-ink-foreground/80 transition-colors hover:bg-ink-hover hover:text-ink-foreground sm:block"
            >
              Landowner Portal
            </Link>
            <Link
              to="/"
              className="rounded-[4px] px-2.5 py-1.5 text-[11.5px] font-medium text-ink-foreground/80 transition-colors hover:bg-ink-hover hover:text-ink-foreground"
            >
              Home
            </Link>
            <Link
              to="/sign-in"
              className="rounded-[4px] border border-white/20 px-3 py-1.5 text-[11.5px] font-medium text-ink-foreground/90 transition-colors hover:bg-ink-hover"
            >
              Officer Sign In
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-5 py-6">
        {children}
      </main>

      <div className="border-t border-border px-5 pt-3 text-center text-[10.5px] leading-relaxed text-muted-foreground">
        Public disclosure under Section 4 &amp; Section 11, RFCTLARR Act, 2013. Personal
        identifiable information excluded per the Digital Personal Data Protection Act, 2023.
      </div>
      <GovFooter />
    </div>
  );
}
